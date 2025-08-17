// Notification with sound
function showNotification() {
    chrome.notifications.create('standUpReminder', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Time to Stand Up!',
        message: 'You\'ve been sitting too long. Stand up and stretch for a minute!',
        priority: 2
    });

    playNotificationSound();
}

function playNotificationSound() {
    chrome.tts.speak('Time to stand up!', {
        voiceName: 'Google UK English Male',
        rate: 1.0,
    });
}

function setupAlarm(intervalInMinutes) {
    chrome.alarms.clear('standUpReminder', () => {
        if (intervalInMinutes > 0) {
            const now = Date.now();
            const scheduledTime = now + (intervalInMinutes * 60000);

            chrome.alarms.create('standUpReminder', {
                when: scheduledTime,
                periodInMinutes: intervalInMinutes
            }, () => notifyPopupAlarmUpdated());
        }
    });
}

function notifyPopupAlarmUpdated() {
    chrome.runtime.sendMessage({ action: 'alarmUpdated' })
        .catch(e => console.log('Message send failed:', e));
}

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === 'standUpReminder') {
        showNotification();
        notifyPopupAlarmUpdated();
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateAlarm') {
        const now = Date.now();
        const scheduledTime = now + (request.interval * 60000);

        chrome.alarms.clear('standUpReminder', () => {
            chrome.alarms.create('standUpReminder', {
                when: scheduledTime,
                periodInMinutes: request.interval
            }, () => {
                sendResponse({
                    success: true,
                    scheduledTime: scheduledTime
                });
            });
        });
        return true;
    }
    else if (request.action === 'testReminder') {
        showNotification();
        sendResponse({ success: true });
    }
    else if (request.action === 'getAlarm') {
        chrome.alarms.get('standUpReminder', (alarm) => {
            sendResponse({ alarm: alarm });
        });
        return true;
    }
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.sync.get(['reminderInterval'], function (result) {
        setupAlarm(result.reminderInterval || 30);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['reminderInterval'], function (result) {
        setupAlarm(result.reminderInterval || 30);
    });
});