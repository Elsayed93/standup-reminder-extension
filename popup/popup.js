document.addEventListener('DOMContentLoaded', function () {
    const intervalInput = document.getElementById('interval');
    const saveButton = document.getElementById('save');
    const testButton = document.getElementById('test');
    const errorElement = document.getElementById('error');
    const countdownContainer = document.getElementById('countdown-container');
    const countdownElement = document.getElementById('countdown');

    let countdownInterval;
    let nextAlarmTime = 0;

    // Load saved interval
    chrome.storage.sync.get(['reminderInterval'], function (result) {
        if (result.reminderInterval) {
            intervalInput.value = result.reminderInterval;
        }
        updateCountdown();
    });

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateCountdown() {
        chrome.runtime.sendMessage({ action: 'getAlarm' }, function (response) {
            if (response.alarm) {
                nextAlarmTime = response.alarm.scheduledTime;
                countdownContainer.style.display = 'block';
                startCountdown();
            } else {
                countdownContainer.style.display = 'none';
                clearInterval(countdownInterval);
            }
        });
    }

    function startCountdown() {
        clearInterval(countdownInterval);
        updateDisplay();
        countdownInterval = setInterval(updateDisplay, 1000);

        function updateDisplay() {
            const now = Date.now();
            const diff = Math.floor((nextAlarmTime - now) / 1000);

            if (diff <= 0) {
                countdownElement.textContent = "00:00";
                clearInterval(countdownInterval);
                setTimeout(updateCountdown, 1000);
            } else {
                countdownElement.textContent = formatTime(diff);
            }
        }
    }

    saveButton.addEventListener('click', function () {
        const interval = parseInt(intervalInput.value);

        if (isNaN(interval) || interval < 1) {
            errorElement.style.display = 'block';
            return;
        }

        errorElement.style.display = 'none';

        chrome.storage.sync.set({ reminderInterval: interval }, function () {
            chrome.runtime.sendMessage({
                action: 'updateAlarm',
                interval: interval
            }, function (response) {
                if (response && response.success) {
                    nextAlarmTime = response.scheduledTime;
                    countdownContainer.style.display = 'block';
                    startCountdown();
                    alert(`Stand up reminder set for every ${interval} minutes!`);
                }
            });
        });
    });

    testButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'testReminder' });
    });

    // Initial countdown update
    updateCountdown();
});