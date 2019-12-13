import {select, templates, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';
import {DatePicker} from './DatePicker.js';
import {HourPicker} from './HourPicker.js';

export class Booking {
  constructor(bookingWidget){
    const thisBooking = this;
    thisBooking.render(bookingWidget);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(bookingWidget){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingWidget;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    //console.log(thisBooking.dom.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    //console.log(thisBooking.dom.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    //console.log(thisBooking.dom.starters);

    thisBooking.dom.bookingButton = thisBooking.dom.wrapper.querySelector(select.booking.bookingButton);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

  }

  getData(){
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };

    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };

    // console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]){
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        thisBooking.tableSelector();
        thisBooking.starterSelector();
      });
    thisBooking.dom.bookingButton.addEventListener('click', function(){
      event.preventDefault();
      thisBooking.bookingSend();
    });
  }


  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    // console.log(eventsCurrent);

    for(let item of bookings){
      //console.log(item);
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      //console.log(item.table);
    }

    for(let item of eventsCurrent) {
      //console.log(item);
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
          //console.log(item);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    //console.log(date, hour, duration, table);
    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (!thisBooking.booked[date][hourBlock]) {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(Number(table));
    }
    // console.log(thisBooking.booked);
  }

  updateDOM(){
    const thisBooking = this;
    console.log('działa updateDOM');
    const newDate = thisBooking.datePicker.value;
    const newHour = utils.hourToNumber(thisBooking.hourPicker.value);

    thisBooking.date = newDate;
    thisBooking.hour = newHour;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    for(let table of thisBooking.dom.tables){
      if(thisBooking.booked[thisBooking.date]  &&
        thisBooking.booked[thisBooking.date][thisBooking.hour]  &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].indexOf(parseInt(table.getAttribute('data-table'))) !== -1){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  tableSelector(){
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function(event){
        const clickedElementClasses = event.target.classList;
        if (clickedElementClasses.contains(classNames.booking.tableBooked)) {
          console.log('nic nie rób');
          return;
        } else {
          event.target.classList.add(classNames.booking.tableBooked);
          const tableId = table.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.tableChosen = tableId;
          console.log('odpal funkcje odpowiedzialna za bookowanie', tableId);
        }
      });
    }
  }

  starterSelector(){
    const thisBooking = this;
    thisBooking.chosenStarters = [];

    for(let starter of thisBooking.dom.starters){
      starter.addEventListener('change', function(){
        if (starter.checked) {
          thisBooking.chosenStarters.push(starter.value);
          console.log(starter.value);
        } else {
          thisBooking.chosenStarters.splice(thisBooking.starters.indexOf(starter.value, 1));
          console.log('nie wybrano startera', starter.value);
        }
      });
    }
  }

  bookingSend(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const peopleNumber = thisBooking.dom.peopleAmount.querySelector('input').value;
    const hourNumber = thisBooking.dom.hoursAmount.querySelector('input').value;

    const payload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour),
      table: thisBooking.tableChosen,
      repeat: false,
      duration: parseInt(hourNumber),
      starter: thisBooking.chosenStarters,
      people: peopleNumber,
    };
    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      })
      .then(function(item){
        thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      });
  }
}
