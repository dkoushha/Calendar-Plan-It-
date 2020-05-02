'use strict';

let CalendarList = [];

function CalendarInfo() {
    this.id = null;
    this.name = null;
    this.checked = true;
    this.color = null;
    this.bgColor = null;
    this.borderColor = null;
    this.dragBgColor = null;
}

function addCalendar(calendar) {
    CalendarList.push(calendar);
}

function findCalendar(id) {
    let found;

    CalendarList.forEach(function (calendar) {
        if (calendar.id === id) {
            found = calendar;
        }
    });

    return found || CalendarList[0];
}

function hexToRGBA(hex) {
    let radix = 16;
    let r = parseInt(hex.slice(1, 3), radix),
        g = parseInt(hex.slice(3, 5), radix),
        b = parseInt(hex.slice(5, 7), radix),
        a = parseInt(hex.slice(7, 9), radix) / 255 || 1;
    let rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';

    return rgba;
}

(function () {
    let calendar;
    let id = 0;

    calendar = new CalendarInfo();
    id += 1;
    calendar.id = String(id);
    calendar.name = 'meeting';
    calendar.color = '#624AC0';
    calendar.bgColor = '#F0EFF6';
    calendar.dragBgColor = '#F0EFF6';
    calendar.borderColor = '#F0EFF6';
    addCalendar(calendar);
})();



(function (window, Calendar) {

    let cal, resizeThrottled;
    let useCreationPopup = true;
    let useDetailPopup = true;
    let datePicker, selectedCalendar;

    cal = new Calendar('#calendar', {
        defaultView: 'month',
        useCreationPopup: useCreationPopup,
        useDetailPopup: useDetailPopup,
        calendars: CalendarList,
        template: {

            allday: function (schedule) {
                return getTimeTemplate(schedule, true);
            },
            time: function (schedule) {
                return getTimeTemplate(schedule, false);
            }
        }
    });

    // event handlers
    cal.on({
        'clickMore': function (e) {
            console.log('clickMore', e);
        },
        'clickSchedule': function (e) {

        },
        'clickDayname': function (date) {
            console.log('clickDayname', date);
        },
        'beforeCreateSchedule': function (e) {

            // $("#create").fadeIn();

            saveNewSchedule(e);
        },
        // to edit an event
        'beforeUpdateSchedule': function (e) {
            let schedule = e.schedule;
            let changes = e.changes;

            console.log('beforeUpdateSchedule', e);

            cal.updateSchedule(schedule.id, schedule.calendarId, changes);
            refreshScheduleVisibility();
        },
        'beforeDeleteSchedule': function (e) {
            console.log('beforeDeleteSchedule', e);
            cal.deleteSchedule(e.schedule.id, e.schedule.calendarId);
        },
        'afterRenderSchedule': function (e) {
            let schedule = e.schedule;
            // let element = cal.getElement(schedule.id, schedule.calendarId);
            // console.log('afterRenderSchedule', element);
        },
        'clickTimezonesCollapseBtn': function (timezonesCollapsed) {
            console.log('timezonesCollapsed', timezonesCollapsed);

            if (timezonesCollapsed) {
                cal.setTheme({
                    'week.daygridLeft.width': '77px',
                    'week.timegridLeft.width': '77px'
                });
            } else {
                cal.setTheme({
                    'week.daygridLeft.width': '60px',
                    'week.timegridLeft.width': '60px'
                });
            }

            return true;
        }
    });

    function getTimeTemplate(schedule, isAllDay) {
        let html = [];
        let start = moment(schedule.start.toUTCString());
        if (!isAllDay) {
            html.push('<strong>' + start.format('HH:mm') + '</strong> ');
        }
        if (schedule.isPrivate) {
            html.push('<span class="calendar-font-icon ic-lock-b"></span>');
            html.push(' Private');
        } else {
            if (schedule.isReadOnly) {
                html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
            } else if (schedule.recurrenceRule) {
                html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
            } else if (schedule.attendees.length) {
                html.push('<span class="calendar-font-icon ic-user-b"></span>');
            } else if (schedule.location) {
                html.push('<span class="calendar-font-icon ic-location-b"></span>');
            }
            html.push(' ' + schedule.title);
        }

        return html.join('');
    }

    function onClickNavi(e) {
        let action = getDataAction(e.target);

        switch (action) {
            case 'move-prev':
                console.log('move-prev');
                cal.prev();
                break;
            case 'move-next':
                cal.next();
                break;
            case 'move-today':
                cal.today();
                break;
            default:
                return;
        }

        setRenderRangeText();
        setSchedules();
    }

    function onNewSchedule() {
        let title = $('#new-schedule-title').val();
        let location = $('#new-schedule-location').val();
        let isAllDay = document.getElementById('new-schedule-allday').checked;
        let start = datePicker.getStartDate();
        let end = datePicker.getEndDate();
        let calendar = selectedCalendar ? selectedCalendar : CalendarList[0];

        if (!title) {
            return;
        }

        console.log('calendar.id ', calendar.id)
        cal.createSchedules([{
            id: '1',
            calendarId: calendar.id,
            title: title,
            isAllDay: isAllDay,
            start: start,
            end: end,
            category: isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            raw: {
                location: location
            },
            state: 'Busy'
        }]);

        $('#modal-new-schedule').modal('hide');
    }

    function onChangeNewScheduleCalendar(e) {
        let target = $(e.target).closest('a[role="menuitem"]')[0];
        let calendarId = getDataAction(target);
        changeNewScheduleCalendar(calendarId);
    }

    function changeNewScheduleCalendar(calendarId) {
        let calendarNameElement = document.getElementById('calendarName');
        let calendar = findCalendar(calendarId);
        let html = [];

        html.push('<span class="calendar-bar" style="background-color: ' + calendar.bgColor + '; border-color:' + calendar.borderColor + ';"></span>');
        html.push('<span class="calendar-name">' + calendar.name + '</span>');

        calendarNameElement.innerHTML = html.join('');

        selectedCalendar = calendar;
    }

    function createNewSchedule(event) {
        let start = event.start ? new Date(event.start.getTime()) : new Date();
        let end = event.end ? new Date(event.end.getTime()) : moment().add(1, 'hours').toDate();

        if (useCreationPopup) {
            cal.openCreationPopup({
                start: start,
                end: end
            });
        }
    }

    function sendData(scheduleData) {

        let dataToSEnd = {
            dataSend: scheduleData
        }
        let xhr = new window.XMLHttpRequest()
        xhr.open('POST', '/events', true)
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        xhr.send(JSON.stringify(dataToSEnd))
    }


    function saveNewSchedule(scheduleData) {
        console.log('scheduleData ', scheduleData)
        let calendar = scheduleData.calendar || findCalendar(scheduleData.calendarId);
        let schedule = {
            id: '1',
            title: scheduleData.title,
            // isAllDay: scheduleData.isAllDay,
            start: scheduleData.start,
            end: scheduleData.end,
            category: 'allday',
            // category: scheduleData.isAllDay ? 'allday' : 'time',
            // dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            location: scheduleData.location,
            // raw: {
            //     class: scheduleData.raw['class']
            // },
            // state: scheduleData.state
        };
        if (calendar) {
            schedule.calendarId = calendar.id;
            schedule.color = calendar.color;
            schedule.bgColor = calendar.bgColor;
            schedule.borderColor = calendar.borderColor;
        }

        cal.createSchedules([schedule]);

        refreshScheduleVisibility();
        sendData(scheduleData)

    }


    function refreshScheduleVisibility() {
        let calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));

        CalendarList.forEach(function (calendar) {
            cal.toggleSchedules(calendar.id, !calendar.checked, false);
        });

        cal.render(true);

        calendarElements.forEach(function (input) {
            let span = input.nextElementSibling;
            span.style.backgroundColor = input.checked ? span.style.borderColor : 'transparent';
        });
    }


    function setRenderRangeText() {
        let renderRange = document.getElementById('renderRange');
        let options = cal.getOptions();
        let viewName = cal.getViewName();
        let html = [];
        if (viewName === 'day') {
            html.push(moment(cal.getDate().getTime()).format('MMM YYYY DD'));
        } else if (viewName === 'month' &&
            (!options.month.visibleWeeksCount || options.month.visibleWeeksCount > 4)) {
            html.push(moment(cal.getDate().getTime()).format('MMM YYYY'));
        } else {
            html.push(moment(cal.getDateRangeStart().getTime()).format('MMM YYYY DD'));
            html.push(' ~ ');
            html.push(moment(cal.getDateRangeEnd().getTime()).format(' MMM DD'));
        }
        renderRange.innerHTML = html.join('');
    }

    function setSchedules() {
        cal.clear();
        let schedules = [{
                id: 489273,
                title: 'Workout for 2020-04-05',
                isAllDay: false,
                start: '2020-03-03T11:30:00+09:00',
                end: '2020-03-03T12:00:00+09:00',
                goingDuration: 30,
                comingDuration: 30,
                color: '#ffffff',
                isVisible: true,
                bgColor: '#69BB2D',
                dragBgColor: '#69BB2D',
                borderColor: '#69BB2D',
                calendarId: '1',
                category: 'allday',
                dueDateClass: '',
                customStyle: 'cursor: default;',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 489273,
                title: 'Workout for 2020-04-05',
                isAllDay: false,
                start: '2020-03-11T11:30:00+09:00',
                end: '2020-03-11T12:00:00+09:00',
                goingDuration: 30,
                comingDuration: 30,
                color: '#ffffff',
                isVisible: true,
                bgColor: '#69BB2D',
                dragBgColor: '#69BB2D',
                borderColor: '#69BB2D',
                calendarId: '2',
                category: 'allday',
                dueDateClass: '',
                customStyle: 'cursor: default;',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 18073,
                title: 'completed with blocks',
                isAllDay: false,
                start: '2020-05-20T09:00:00+09:00',
                end: '2020-05-20T10:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#54B8CC',
                dragBgColor: '#54B8CC',
                borderColor: '#54B8CC',
                calendarId: '1',
                category: 'allday',
                dueDateClass: '',
                customStyle: '',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 18073,
                title: 'completed with blocks',
                isAllDay: false,
                start: '2020-05-25T09:00:00+09:00',
                end: '2020-05-25T10:00:00+09:00',
                color: '#ffffff',
                isVisible: false,
                bgColor: '#54B8CC',
                dragBgColor: '#54B8CC',
                borderColor: '#54B8CC',
                calendarId: '1',
                category: 'allday',
                dueDateClass: '',
                customStyle: '',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 18073,
                title: 'completed with blocks',
                isAllDay: false,
                start: '2020-01-28T09:00:00+09:00',
                end: '2020-01-28T10:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#54B8CC',
                dragBgColor: '#54B8CC',
                borderColor: '#54B8CC',
                calendarId: '1',
                category: 'allday',
                dueDateClass: '',
                customStyle: '',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 18073,
                title: 'completed with blocks',
                isAllDay: false,
                start: '2020-03-07T09:00:00+09:00',
                end: '2020-03-07T10:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#54B8CC',
                dragBgColor: '#54B8CC',
                borderColor: '#54B8CC',
                calendarId: '1',
                category: 'allday',
                dueDateClass: '',
                customStyle: '',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 18073,
                title: 'Time Schedule Need BGCOLOR',
                isAllDay: false,
                start: '2020-03-28T09:00:00+09:00',
                end: '2020-03-28T10:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#54B8CC',
                dragBgColor: '#54B8CC',
                borderColor: '#54B8CC',
                calendarId: '1',
                category: 'time',
                dueDateClass: '',
                customStyle: '',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },
            {
                id: 18073,
                title: 'Time Schedule Need BGCOLOR',
                isAllDay: false,
                start: '2020-03-17T09:00:00+09:00',
                end: '2020-03-17T10:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#54B8CC',
                dragBgColor: '#54B8CC',
                borderColor: '#54B8CC',
                calendarId: '3',
                category: 'time',
                dueDateClass: '',
                customStyle: '',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            }
        ];
        // generateSchedule(cal.getViewName(), cal.getDateRangeStart(), cal.getDateRangeEnd());
        cal.createSchedules(schedules);
        // cal.createSchedules(schedules);
        refreshScheduleVisibility();
    }

    function setEventListener() {
        $('#menu-navi').on('click', onClickNavi);

        // $('.dropdown-menu a[role="menuitem"]').on('click', onClickMenu);
        // $('#lnb-calendars').on('change', onChangeCalendars);

        $('#btn-save-schedule').on('click', onNewSchedule);
        $('#btn-new-schedule').on('click', createNewSchedule);


        $('#dropdownMenu-calendars-list').on('click', onChangeNewScheduleCalendar);

        window.addEventListener('resize', resizeThrottled);
    }

    function getDataAction(target) {
        return target.dataset ? target.dataset.action : target.getAttribute('data-action');
    }

    resizeThrottled = tui.util.throttle(function () {
        cal.render();
    }, 50);

    window.cal = cal;

    // setDropdownCalendarType();
    setRenderRangeText();
    setSchedules();
    setEventListener();
})(window, tui.Calendar);

// set calendars
(function () {
    // let calendarList = document.getElementById('calendarList');
    // let html = [];
    // CalendarList.forEach(function(calendar) {
    //     html.push('<div class="lnb-calendars-item"><label>' +
    //         '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
    //         '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
    //         '<span>' + calendar.name + '</span>' +
    //         '</label></div>'
    //     );
    // });
    // calendarList.innerHTML = html.join('\n');
})();