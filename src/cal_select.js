var CalSelect = Class.create({

  initialize: function(dateField) {
    this.dateField = $(dateField);
    this.initCalWrapper();
    this.initObservers();
  },

  initCalWrapper: function() {
    this.calWrapper = new Element('div', { className: 'calendar' });
    this.calWrapper.observe('calSelect:dateClicked', function(event) {
      this.setDate(event.memo.date);
    }.bindAsEventListener(this));
    this.calWrapper.hide();
    this.dateField.insert({after: this.calWrapper});
  },

  initObservers: function() {
    this.dateField.observe('focus', this.show.bind(this));
    this.dateField.observe('keydown', function(event) {
      if (event.keyCode == Event.KEY_TAB) { this.hide(); }
    }.bindAsEventListener(this));

    document.observe('click', this.hide.bind(this));

    this.dateField.observe('click', Event.stop);
    this.calWrapper.observe('click', Event.stop);
  },

  show: function() {
    this.dateField.select();
    var selectedDate = this.getDate();
    var pageDate = selectedDate ? selectedDate.clone() : new Date();
    var calPage = new CalSelect.Page(pageDate, selectedDate);
    this.calWrapper.update(calPage);
    this.setPosition();
    this.calWrapper.show();
  },

  setPosition: function() {
    var offset = this.dateField.positionedOffset();
    offset.top += this.dateField.getHeight();
    this.calWrapper.setStyle({left: offset.left+'px', top: offset.top+'px'});    
  },

  hide: function() {
    this.calWrapper.hide();
  },

  // TODO: refactor this out to a separate DateParse class?
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
  },

  monthIdx: function() {
    return this.pageDate.getMonth();
  },

  toElement: function() {
    this.calTable = new Element('table').insert(new Element('thead'));

    this.calTable.tHead.observe('calSelect:pagerClicked', function(event) {
      this.advance(event.memo.advanceBy);
    }.bindAsEventListener(this));

    this.calTable.tHead.insert(new CalSelect.MonthHeader(this.pageDate));
    this.calTable.tHead.insert(new CalSelect.DayHeaders());
    this.calTable.insert(new CalSelect.Month(this.pageDate, this.selectedDate));
    
    return this.calTable;
  },

  advance: function(months) {
    this.pageDate.setMonth(this.pageDate.getMonth() + months);
    this.calTable.replace(this);
  },

});

CalSelect.MonthHeader = Class.create({

  initialize: function(date) {
    this.pageDate = date;
  },

  toElement: function() {
    var tr = new Element('tr');

    tr.insert(new CalSelect.LeftPager());

    var month = new Element('th', { colSpan: 5 });
    tr.insert(month);
    // push "Month YYYY" down to date?
    month.insert(this.pageDate.getMonthName() + ' ' + this.pageDate.getFullYear());
    
    tr.insert(new CalSelect.RightPager());

    return tr;
  },

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
    this.pageDate = pageDate;
    this.selectedDate = selectedDate;
  },

  toElement: function() {
    var calCell = new Element('td');
    this.addClassNames(calCell);
    calCell.insert(this.date.getDate());
    calCell.observe('click', function() {
      calCell.fire("calSelect:dateClicked", {date: this.date});
    }.bind(this));
    return calCell;
  },

  addClassNames: function(element) {
    var classNames = $H({
      selected: this.date.sameDateAs(this.selectedDate),
      today:    this.date.isToday(),
      other:    !this.date.sameMonthAs(this.pageDate)
    });

    classNames.each(function(pair) {
      pair.value && element.addClassName(pair.key);
    });
  }
  
});
