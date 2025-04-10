        // Constants
        const DEFAULT_LOCATION = {
            city: "Thakurgaon",
            country: "Bangladesh",
            method: 2,
            latitude: 26.0310,
            longitude: 88.4699
        };

        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const banglaDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        const banglaMonths = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'];
        const hijriMonths = ['মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ্জ'];

        // Convert numbers to Bengali
        function toBanglaNumber(num) {
            return num.toString().split('').map(digit => banglaDigits[parseInt(digit)]).join('');
        }

        // Get Bengali date
        function getBanglaDate(gregorianDate) {
            const gregorianYear = gregorianDate.getFullYear();
            const gregorianMonth = gregorianDate.getMonth();
            const gregorianDay = gregorianDate.getDate();
            
            let banglaYear = gregorianYear - 593;
            const isBeforeBoishakh = (gregorianMonth < 3 || (gregorianMonth === 3 && gregorianDay < 14));
            if (isBeforeBoishakh) banglaYear -= 1;
            
            const banglaStart = new Date(gregorianYear - (isBeforeBoishakh ? 1 : 0), 3, 14);
            const diffMs = gregorianDate - banglaStart;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            const banglaMonthDays = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
            let banglaMonth = 0;
            let banglaDay = diffDays + 1;
            
            for (let i = 0; i < banglaMonthDays.length; i++) {
                if (banglaDay <= banglaMonthDays[i]) {
                    banglaMonth = i;
                    break;
                }
                banglaDay -= banglaMonthDays[i];
            }
            
            return {
                day: banglaDay,
                month: banglaMonths[banglaMonth],
                year: banglaYear
            };
        }

        // Update date displays
        async function updateDates() {
            const now = new Date();
            
            const gregorianDay = banglaDays[now.getDay()];
            const banglaDate = getBanglaDate(now);
            const banglaDayStr = toBanglaNumber(banglaDate.day);
            const banglaYearStr = toBanglaNumber(banglaDate.year);
            
            document.getElementById('gregorianDate').innerText = `${gregorianDay}, ${banglaDayStr} ${banglaDate.month} ${banglaYearStr}`;
            
            try {
                const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}`);
                const data = await response.json();
                const hijri = data.data.hijri;
                const hijriDay = toBanglaNumber(hijri.day);
                const hijriMonth = hijriMonths[parseInt(hijri.month.number) - 1];
                const hijriYear = toBanglaNumber(hijri.year);
                
                document.getElementById('hijriDate').innerText = `${hijriDay} ${hijriMonth} ${hijriYear} হিজরি`;
            } catch (error) {
                document.getElementById('hijriDate').innerText = "হিজরি তারিখ লোড করতে ব্যর্থ";
            }
            
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            document.getElementById('updateTime').textContent = `${toBanglaNumber(hours)}:${toBanglaNumber(minutes)}`;
        }

        // Time conversion functions
        function convertTo12Hour(time24) {
            if (!time24 || time24 === "--:--") return "--:-- --";
            const [hour, minute] = time24.split(":").map(Number);
            const period = hour >= 12 ? "PM" : "AM";
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
        }

        function getCurrentTime() {
            const now = new Date();
            return now.getHours() * 60 + now.getMinutes();
        }

        function getTimeInMinutes(timeStr) {
            if (!timeStr || timeStr === "--:--") return 0;
            const [hour, minute] = timeStr.split(":").map(Number);
            return hour * 60 + minute;
        }

        function getTimeDiff(futureTimeStr) {
            const now = new Date();
            const [hour, minute] = futureTimeStr.split(":").map(Number);
            const future = new Date(now);
            future.setHours(hour, minute, 0, 0);
            let diff = Math.floor((future - now) / 1000);
            if (diff < 0) {
                future.setDate(future.getDate() + 1);
                diff = Math.floor((future - now) / 1000);
            }
            return diff;
        }

        function formatTimeDiff(diff) {
            if (diff < 0) return "--:--:--";
            const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const seconds = String(diff % 60).padStart(2, '0');
            return `${toBanglaNumber(hours)}:${toBanglaNumber(minutes)}:${toBanglaNumber(seconds)}`;
        }

        function calculatePrayerPeriods(timings) {
            return {
                Fajr: { start: timings.Fajr, end: timings.Sunrise },
                Dhuhr: { start: timings.Dhuhr, end: timings.Asr },
                Asr: { start: timings.Asr, end: timings.Maghrib },
                Maghrib: { start: timings.Maghrib, end: timings.Isha },
                Isha: { start: timings.Isha, end: "23:59" }
            };
        }

        // Countdown timer
        let countdownInterval;
        function updateCountdown(nextPrayerTime) {
            clearInterval(countdownInterval);
            const countdownElement = document.getElementById("countdownTimer");
            
            function update() {
                const diff = getTimeDiff(nextPrayerTime);
                if (diff <= 0) {
                    clearInterval(countdownInterval);
                    fetchPrayerTimes();
                    return;
                }
                countdownElement.innerText = formatTimeDiff(diff);
            }
            
            update();
            countdownInterval = setInterval(update, 1000);
        }

        function isDataValid(savedData) {
            if (!savedData) return false;
            const savedDate = new Date(savedData.timestamp);
            const now = new Date();
            return savedDate.getDate() === now.getDate() &&
                   savedDate.getMonth() === now.getMonth() &&
                   savedDate.getFullYear() === now.getFullYear();
        }

        async function getCityName(latitude, longitude) {
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=bn`);
                const data = await response.json();
                return data.locality || data.city || data.principalSubdivision || "অজানা অবস্থান";
            } catch (error) {
                return "অজানা অবস্থান";
            }
        }

        async function fetchPrayerTimes() {
            document.getElementById("currentPrayerName").innerText = "--";
            document.getElementById("nextPrayerName").innerText = "--";
            document.getElementById("countdownTimer").innerText = "--:--:--";
            document.getElementById("locationInfo").innerText = "অবস্থান লোড হচ্ছে...";

            const savedData = JSON.parse(localStorage.getItem('prayerData'));
            if (savedData && isDataValid(savedData)) {
                const locationName = await getCityName(savedData.latitude, savedData.longitude);
                displayPrayerTimes(savedData.timings, savedData.latitude, savedData.longitude, locationName);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const [prayerResponse, locationName] = await Promise.all([
                            fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`),
                            getCityName(latitude, longitude)
                        ]);
                        
                        const prayerData = await prayerResponse.json();
                        const timings = prayerData.data.timings;
                        
                        localStorage.setItem('prayerData', JSON.stringify({
                            latitude,
                            longitude,
                            timings,
                            timestamp: new Date().toISOString()
                        }));
                        
                        displayPrayerTimes(timings, latitude, longitude, locationName);
                    } catch (err) {
                        console.error("Error fetching prayer times:", err);
                        fetchDefaultPrayerTimes();
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    fetchDefaultPrayerTimes();
                }
            );
        }

        async function fetchDefaultPrayerTimes() {
            try {
                const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${DEFAULT_LOCATION.city}&country=${DEFAULT_LOCATION.country}&method=${DEFAULT_LOCATION.method}`);
                const data = await response.json();
                
                document.getElementById('locationInfo').textContent = `${DEFAULT_LOCATION.city} জেলা, বাংলাদেশ`;
                
                displayPrayerTimes(data.data.timings, DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, `${DEFAULT_LOCATION.city} জেলা, বাংলাদেশ`);
                
                localStorage.setItem('prayerData', JSON.stringify({
                    latitude: DEFAULT_LOCATION.latitude,
                    longitude: DEFAULT_LOCATION.longitude,
                    timings: data.data.timings,
                    timestamp: new Date().toISOString()
                }));
                
            } catch (error) {
                console.error("Error fetching prayer times:", error);
                document.getElementById('locationInfo').textContent = "ডেটা লোড করতে ব্যর্থ";
            }
        }

        function displayPrayerTimes(timings, latitude, longitude, locationName) {
            const prayerPeriods = calculatePrayerPeriods(timings);
            const nowMins = getCurrentTime();
            
            document.getElementById("fajrTime").innerText = convertTo12Hour(timings.Fajr);
            document.getElementById("fajrPeriod").innerText = `${convertTo12Hour(prayerPeriods.Fajr.start)} - ${convertTo12Hour(prayerPeriods.Fajr.end)}`;
            
            document.getElementById("dhuhrTime").innerText = convertTo12Hour(timings.Dhuhr);
            document.getElementById("dhuhrPeriod").innerText = `${convertTo12Hour(prayerPeriods.Dhuhr.start)} - ${convertTo12Hour(prayerPeriods.Dhuhr.end)}`;
            
            document.getElementById("asrTime").innerText = convertTo12Hour(timings.Asr);
            document.getElementById("asrPeriod").innerText = `${convertTo12Hour(prayerPeriods.Asr.start)} - ${convertTo12Hour(prayerPeriods.Asr.end)}`;
            
            document.getElementById("maghribTime").innerText = convertTo12Hour(timings.Maghrib);
            document.getElementById("maghribPeriod").innerText = `${convertTo12Hour(prayerPeriods.Maghrib.start)} - ${convertTo12Hour(prayerPeriods.Maghrib.end)}`;
            
            document.getElementById("ishaTime").innerText = convertTo12Hour(timings.Isha);
            document.getElementById("ishaPeriod").innerText = `${convertTo12Hour(prayerPeriods.Isha.start)} - ${convertTo12Hour(prayerPeriods.Isha.end)}`;

            const prayers = [
                { name: 'ফজর', time: timings.Fajr, end: timings.Sunrise },
                { name: 'যোহর', time: timings.Dhuhr, end: timings.Asr },
                { name: 'আসর', time: timings.Asr, end: timings.Maghrib },
                { name: 'মাগরিব', time: timings.Maghrib, end: timings.Isha },
                { name: 'এশা', time: timings.Isha, end: "23:59" }
            ];

            let currentIndex = -1;
            for (let i = 0; i < prayers.length; i++) {
                const prayerTime = getTimeInMinutes(prayers[i].time);
                if (nowMins >= prayerTime) {
                    currentIndex = i;
                }
            }

            if (currentIndex === -1) {
                currentIndex = prayers.length - 1;
            }

            const nextIndex = (currentIndex + 1) % prayers.length;
            const currentPrayer = prayers[currentIndex];
            const nextPrayer = prayers[nextIndex];

            document.querySelectorAll('.prayer-card').forEach(card => {
                card.classList.remove('current-prayer', 'next-prayer');
                const prayerName = card.querySelector('.prayer-name').textContent;
                if (prayerName === currentPrayer.name) {
                    card.classList.add('current-prayer');
                } else if (prayerName === nextPrayer.name) {
                    card.classList.add('next-prayer');
                }
            });

            document.getElementById("currentPrayerName").innerText = currentPrayer.name;
            document.getElementById("nextPrayerName").innerText = nextPrayer.name;
            document.getElementById("locationInfo").innerText = locationName;

            updateCountdown(nextPrayer.time);

            const icon = document.getElementById("floatingIcon");
            icon.classList.add("notify");
            setTimeout(() => icon.classList.remove("notify"), 10000);
        }

        function toggleVisibility() {
            const container = document.querySelector(".container");
            container.classList.toggle("hidden");
            
            const icon = document.getElementById("floatingIcon");
            if (container.classList.contains("hidden")) {
                icon.innerHTML = '<i class="fas fa-mosque"></i>';
            } else {
                icon.innerHTML = '<i class="fa fa-eye-slash"></i>';
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            updateDates();
            fetchPrayerTimes();
            
            setInterval(updateDates, 86400000);
            setInterval(fetchPrayerTimes, 3600000);
            
            document.getElementById("floatingIcon").addEventListener('click', toggleVisibility);
        });