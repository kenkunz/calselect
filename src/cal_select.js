var CalSelect = Class.create({

  initialize: function(dateField) {
    this.dateField = $(dateField);
    this.insertCalendar();
    this.registerFieldObservers();
    this.documentClickHandler = this._documentClickHandler.bindAsEventListener(this);
  },

  insertCalendar: function() {
    this.calendar = new Element('div', { className: 'calendar' });
    this.calendar.observe('calSelect:dateClicked', function(event) {
      this.setDate(event.memo.date);
    }.bindAsEventListener(this));
    this.calendar.hide();
    this.dateField.insert({after: this.calendar});
  },

  registerFieldObservers: function() {
    this.dateField.observe('focus', this.show.bind(this));
    this.dateField.observe('keydown', function(event) {
      if (event.keyCode == Event.KEY_TAB) { this.hide(); }
    }.bindAsEventListener(this));
  },

  show: function() {
    if (!this.calendar.visible()) {
      this.dateField.select();
      var selectedDate = this.getDate();
      var pageDate = selectedDate ? selectedDate.clone() : new Date();
      var calPage = new CalSelect.Page(pageDate, selectedDate);
      this.calendar.update(calPage);
      this.setPosition();
      document.observe('click', this.documentClickHandler);
      this.calendar.show();
    }
  },

  hide: function() {
    document.stopObserving('click', this.documentClickHandler);
    this.calendar.hide();
  },

  setPosition: function() {
    var offset = this.dateField.positionedOffset();
    offset.top += this.dateField.getHeight();
    this.calendar.setStyle({left: offset.left+'px', top: offset.top+'px'});    
  },

  _documentClickHandler: function(event) {
    var element = event.element();
    if (element != this.dateField && !element.descendantOf(this.calendar)) {
      this.hide();
    }
  },

  getDate: function() {
    var dateStr = $F(this.dateField);
    var dateMatch = dateStr.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{2}(\d{2})?)\s*$/);
    if (dateMatch) {
      var month = dateMatch[1] - 1;
      var day   = dateMatch[2];
      var year  = dateMatch[3];
      if (!dateMatch[4]) { year = '20' + year; }
      return new Date(year, month, day);
    } else {
      return null;
    }
  },

  setDate: function(date) {
    this.dateField.setValue(date.toShortString());
    this.hide();
  }

});
CalSelect.Version = '0.1';

CalSelect.Page = Class.create({

  initialize: function(pageDate, selectedDate) {
    this.pageDate = pageDate.startOfMonth();
    this.selectedDate = selectedDate;
    this.calTable = new Element('table');
  },

  toElement: function() {
    this.draw();
    return this.calTable;
  },

  draw: function() {
    this.calTable.update(new Element('thead'));
    this.calTable.tHead.observe('calSelect:pagerClicked', function(event) {
      this.advance(event.memo.advanceBy);
    }.bindAsEventListener(this));

    this.calTable.tHead.insert(new CalSelect.MonthHeader(this.pageDate));
    this.calTable.tHead.insert(new CalSelect.DayHeaders());
    this.calTable.insert(new CalSelect.Month(this.pageDate, this.selectedDate));    
  },

  advance: function(months) {
    this.pageDate.setMonth(this.pageDate.getMonth() + months);
    this.draw();
  }

});

CalSelect.MonthHeader = Class.create({

  initialize: function(date) {
    this.pageDate = date;
  },

  toElement: function() {
    var tr = new Element('tr');
    tr.insert(new CalSelect.LeftPager());
    tr.insert(this.monthYearHeader());
    tr.insert(new CalSelect.RightPager());
    return tr;
  },

  monthYearHeader: function() {
    var month = new Element('th', { colSpan: 5 });
    month.insert(this.pageDate.getMonthYearHeader());
    return month;
  }

});

// This is basically an abstract class; subclasses should define displayVal
// and advanceBy attributes
CalSelect.Pager = Class.create({
  toElement: function() {
    var th = new Element('th', { className: 'pager' }).insert(this.displayVal);
    th.observe('click', function() {
      th.fire("calSelect:pagerClicked", {advanceBy: this.advanceBy});
    }.bind(this));
    return th;
  }
});
CalSelect.LeftPager = Class.create(CalSelect.Pager, {
  displayVal: '&#171;',
  advanceBy: -1
});
CalSelect.RightPager = Class.create(CalSelect.Pager, {
  displayVal: '&#187;',
  advanceBy: 1
});


CalSelect.DayHeaders = Class.create({
  labels: $w('S M T W T F S'),
  toElement: function() {
    return this.labels.inject(new Element('tr'), function(row, day) {
      return row.insert(new Element('th').insert(day));
    });
  }
});

CalSelect.Month = Class.create({

  initialize: function(pageDate, selectedDate) {
    this.pageDate = pageDate;
    this.selectedDate = selectedDate;
  },

  dateRange: function() {
    return $R(this.pageDate.startOfMonth().startOfWeek(),
              this.pageDate.endOfMonth().endOfWeek());
  },

  toElement: function() {
    var calBody = new Element('tbody');
    var calRow;

    this.dateRange().each(function(date) {
      if (date.getDay() == 0) {
        calRow = new Element('tr');
        calBody.insert(calRow);
      }
      calRow.insert(new CalSelect.DateCell(date, this.pageDate, this.selectedDate));
    }.bind(this));

    return calBody;
  }

});

CalSelect.DateCell = Class.create({
  
  initialize: function(date, pageDate, selectedDate) {
    this.date = date;

    var classNames = [];
    if (date.sameDateAs(selectedDate)) { classNames.push('selected') }
    if (date.isToday())                { classNames.push('today') }
    if (!date.sameMonthAs(pageDate))   { classNames.push('other') }
    this.className = classNames.join(' ');
  },

  toElement: function() {
    var calCell = new Element('td', { className: this.className });
    calCell.insert(this.date.getDate());
    calCell.observe('click', function() {
      calCell.fire("calSelect:dateClicked", {date: this.date});
    }.bind(this));
    return calCell;
  }
  
});
