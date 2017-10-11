import {
	Component,
	OnInit,
	HostBinding,
	Input,
	ViewChild,
	ElementRef,
	AfterViewInit
} from '@angular/core';
import {Day, Week, Month} from 'app/common/models/datepicker.model';
import {Options} from 'app/common/models/datepicker-options.model';
import {UtilitiesService} from 'app/common/services/utilities.service.';


@Component({
	selector: 'app-datepicker',
	templateUrl: './datepicker.component.html',
	styleUrls: ['./datepicker.component.scss']
})
export class DatepickerComponent implements OnInit, AfterViewInit {

	@Input() public options: Options = {
		theme: '', // Theme string is added to the host
		selectMultiple: false, // Select multiple dates
		showRestDays: true, // Show the rest days from previous and next months
		closeOnSelect: true,  // Close datepicker when date(s) selected
		animate: true, // Animate the datepicker
		animationSpeed: 400, // Animation speed in ms
		easing: 'ease-in', // Easing type string
		numberOfMonths: 3, // Number of months shown
		slideBy: null, // Number of months shown
		hideRestDays: false, // hide the rest days
		disableRestDays: true, // disable the click on rest days
		range: true, // Use range functionality
		min: null, // Disables dates until this date
		max: null // Disables dates from this date
	}

	/**
	 * Set the the language manualy. A string with a BCP 47 language tag
	 * @example nl-NL
	 */
	@Input() public language: string = navigator.language;

	@ViewChild('calendarContainer') public calendarContainer: ElementRef;
	@ViewChild('calendarTopContainer') public calendarTopContainer: ElementRef;

	@HostBinding('style.width.px') public datepickerWidth: number;
	@HostBinding('style.height.px') public datepickerHeight: number;
	@HostBinding('class') @Input() theme: string;
	@HostBinding('class.is-animate') public animate: boolean = this.options.animate;

	public leftPosition = 0;
	public transition: string;
	public translateX: number;
	public isOpen = false;
	public isAnimating = false;
	private visibleWidth = this.options.animate ? 50 : 100;
	public calendarWidth = this.visibleWidth / this.options.numberOfMonths;

	public date: Date = new Date();
	public today: Date = this.date;
	private year: number = this.date.getFullYear();
	private month: number = this.date.getMonth();
	public months: Month[] = null;
	private days: Day[] = null;
	private selectedDates: Date[] = [];

	public weekdays: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
	public numberOfMonths: Number[] = new Array(this.options.numberOfMonths);
	public currentMonthYear: Object[];

	public selectedRange = 'startDate';
	public startDate: Date = null;
	public endDate: Date = null;

	/**
	 * Create a week array from the merged day arrays
	 * @param dayArray
	 * @return Week[]
	 */
	static createWeekArray(dayArray: Day[]): Week[] {
		const size = 7;
		const weeks = [];
		while (dayArray.length) {
			weeks.push({
				days: dayArray.splice(0, size)
			});
		}
		return weeks;
	}

	ngOnInit() {
		if (this.options.numberOfMonths > 1) {
			this.months = this.getNextMonthArray(this.month, this.year, true);
		} else {
			this.months = this.createCalendarArray(this.year, this.month);
		}

		if (this.options.range && this.options.selectMultiple) {
			console.warn('Multiple does not work in combination with the range option');
		}
		if (this.options.range && this.options.showRestDays) {
			console.warn('Showing rest days is not compatible with the range option');
		}
		if (this.options.animate && this.options.showRestDays) {
			console.warn('Showing rest days is not possible in combination with the animate option');
		}
	}

	/**
	 * Constructor - constucts the component with parameters
	 * @param elementRef
	 * @param utilities
	 */
	constructor(private elementRef: ElementRef,
				private utilities: UtilitiesService) {
	}

	ngAfterViewInit() {
		if (this.options.animate || this.options.numberOfMonths > 1) {
			setTimeout(() => {
				if (this.options.animate) {
					this.datepickerHeight = this.calendarContainer.nativeElement.offsetHeight + this.calendarTopContainer.nativeElement.offsetHeight;
				}
				this.datepickerWidth = this.elementRef.nativeElement.offsetWidth * this.options.numberOfMonths;
			}, 1);
		}
	}

	/**
	 * Set the datepicker height, used when animating
	 * @param directionRight
	 */
	setDatepickerHeight(directionRight?: boolean) {
		let indexArray;
		let offsetHeight;

		if (this.options.numberOfMonths > 1) {
			const start = directionRight ? 0 : this.options.numberOfMonths;
			const end = directionRight ? this.options.numberOfMonths - 1 : this.options.numberOfMonths + this.options.numberOfMonths - 1;
			indexArray = this.utilities.createArray(start, end);
		} else {
			indexArray = directionRight ? [0] : [1];
		}

		const that = this;
		setTimeout(function () {
			const calendarArray = that.elementRef.nativeElement.querySelectorAll('.datepicker__calendar-container');

			indexArray.forEach(el => {
				if (offsetHeight === undefined || calendarArray[el].offsetHeight > offsetHeight) {
					offsetHeight = calendarArray[el].offsetHeight;
				}
			});
			that.datepickerHeight = offsetHeight + that.calendarTopContainer.nativeElement.offsetHeight;
		});
	}

	/**
	 * Creates a day array
	 * @param year
	 * @param month
	 * @param isRestDays
	 * @return Day[]
	 */
	createDayArray(year: number, month: number, isRestDays?: boolean): Day[] {
		const days = [];
		const daysInMonth = this.getDaysInMonth(year, month);

		for (let index = 0; index < daysInMonth; index++) {
			const dayNumber = index + 1;
			const date = new Date(year, month, dayNumber);
			const day = {
				date,
				dayNumber,
				isToday: this.isToday(date),
				isSelected: this.isSelected(date),
				isRest: isRestDays,
				isHidden: isRestDays && (this.options.animate || this.options.hideRestDays),
				isDisabled: this.isDisabled(date) || isRestDays && this.options.disableRestDays,
				isInRange: this.isInRange(date),
				isStartDate: this.isStartDate(date),
				isEndDate: this.isEndDate(date)
			};
			days.push(day);
		}

		return days;
	}

	/**
	 * Get the days from the next month and fills the last week of the current
	 * @return Day[]
	 */
	getNextRestDays(year, month): Day[] {
		const monthLength = this.getDaysInMonth(month, year);
		const endOfTheMonth = new Date(month, year, monthLength).getDay();
		const nextDays = this.createDayArray(this.getYearOfNextMonth(month, year), this.getNextMonth(month), true).slice(0, 7 - endOfTheMonth);
		return nextDays.length > 6 ? [] : nextDays;
	}

	/**
	 * Get the days of the previous month and fills the first week of the current
	 * @return Day[]
	 */
	getPreviousRestDays(year, month): Day[] {
		const startOfTheMonth = new Date(year, month, 0).getDay();
		const previousDays = this.createDayArray(this.getYearOfPreviousMonth(month, year), this.getPreviousMonth(month), true);
		return previousDays.slice(previousDays.length - startOfTheMonth, previousDays.length);
	}

	/**
	 * Merge all the day arrays together
	 * @return Day[]
	 */
	getMergedDayArrays(year, month): Day[] {
		return [
			...this.getPreviousRestDays(year, month),
			...this.createDayArray(year, month),
			...this.getNextRestDays(year, month)
		]
	}

	/**
	 * Create the calendar array from the week arrays
	 * @param year
	 * @param month
	 */
	createCalendarArray(year, month): [{ weeks: Week[] }] {
		this.date = new Date(year, month);
		const dayArray = this.getMergedDayArrays(year, month);
		const weeks = DatepickerComponent.createWeekArray(dayArray);
		return [{weeks: weeks}]
	}

	/**
	 * Get next month array, gets multiple months.
	 * Used when the options animate is set or multiple months are visable
	 * @return Month[]
	 */
	getNextMonthArray(month: number, year: number, keepDate = false): Month[] {
		const array = [];
		let times = this.options.numberOfMonths;

		if (this.options.animate) {
			times = times * 2;
		}

		for (let index = 0; index < times; index++) {
			array[index] = {'month': month, 'year': year};
			month = this.getNextMonth(month);
			year = this.getYearOfNextMonth(month, year);

			if (!keepDate && index === (this.options.numberOfMonths - 1)) {
				this.month = month;
				this.year = year;
			}
		}

		const monthArray = [];
		array.forEach(e => {
			monthArray.push(this.createCalendarArray(e.year, e.month));
		});

		const nextMonths = [].concat.apply([], monthArray);
		this.resetStyle();
		this.currentMonthYear = array;

		return nextMonths;
	}

	/**
	 * Reset Style
	 * @param resetForPrevious - Optional
	 */
	resetStyle(resetForPrevious?: boolean) {
		this.transition = 'transform 0ms ease-in';
		this.translateX = 0;
		this.leftPosition = resetForPrevious ? -100 : 0;
	}

	/**
	 * Gets an array of previous months. Used for animation and when more months are displayed
	 * @param month
	 * @param year
	 * @param keepDate
	 */
	getPreviousMonthArray(month: number, year: number, keepDate = false): Month[] {
		const array = [];
		let times = this.options.numberOfMonths;

		if (this.options.animate) {
			times = times * 2;
		}

		for (let index = 0; index < times; index++) {

			if (this.options.animate) {
				array[index] = {'month': month, 'year': year};
			}

			month = this.getPreviousMonth(month);
			year = this.getYearOfPreviousMonth(month, year);

			if (!this.options.animate) {
				array[index] = {'month': month, 'year': year};
			}

			if (!keepDate) {
				if (this.options.animate && index === (this.options.numberOfMonths - 1)) {
					this.month = month;
					this.year = year;
				} else if (!this.options.animate && index === (this.options.numberOfMonths - 1)) {
					this.month = month;
					this.year = year;
				}
			}
		}

		const previousArray = [];
		array.reverse().forEach(e => {
			previousArray.push(this.createCalendarArray(e.year, e.month));
		});

		const previousMonths = [].concat.apply([], previousArray);
		this.resetStyle(true);
		const months = previousMonths;
		this.currentMonthYear = array;


		return months;
	}

	/**
	 * Update value is being triggered
	 * @param date
	 */
	updateValue(date: Date): void {
		if (this.options.range) {
			this.selectRange(date);
		} else if (!this.isSelected(date)) {
			if (this.options.selectMultiple) {
				this.selectDate(date);
			} else {
				this.toggleDate(date);
			}
		} else {
			this.deselectDate(date);
		}

		if (this.options.animate || this.options.numberOfMonths > 1) {

			this.resetStyle();
			this.months = this.getNextMonthArray(this.month, this.year, true);

		} else {

			this.month = this.getNextMonth(this.month);
			this.year = this.getYearOfNextMonth(this.month, this.year);
			this.months = this.createCalendarArray(this.year, this.month);

		}

	}

	/**
	 * Select range method - contains the logic to select the start- and endrange
	 * @param date
	 */
	selectRange(date: Date): void {
		if (this.isEarlier(date, this.startDate)) {
			if (this.startDate) {
				this.toggleDate(date, this.startDate);
			} else {
				this.selectDate(date);
			}
			this.startDate = date;
			this.selectEndDate();
		} else if (this.endDate && this.isLater(date, this.endDate)) {
			this.toggleDate(date, this.endDate);
			this.endDate = date;
			this.selectStartDate();
		} else if (this.selectedRange === 'startDate') {
			if (this.startDate) {
				this.toggleDate(date, this.startDate);
			} else {
				this.selectDate(date);
			}
			this.startDate = date;
			this.selectEndDate();
		} else if (this.selectedRange === 'endDate') {
			if (this.endDate) {
				this.toggleDate(date, this.endDate);
			} else {
				this.selectDate(date);
			}
			this.endDate = date;
			this.selectStartDate();
			if (this.options.closeOnSelect) {
				this.close();
			}
		}
	}

	/**
	 * Toggle a date. One in, on out.
	 * @param date - Date to be toggled on
	 * @param toggleDate - Optional set specific date to toggle off
	 */
	toggleDate(date: Date, toggleDate?: Date): void {
		if (!toggleDate) {
			this.selectedDates = [];
		} else {
			this.deselectDate(toggleDate);
		}
		this.selectDate(date);
	}

	/**
	 * Select a date
	 * @param date
	 */
	selectDate(date: Date): void {
		this.selectedDates.push(date);
	}

	/**
	 * Deselect a date
	 * @param date
	 */
	deselectDate(date: Date): void {
		this.selectedDates = this.selectedDates.filter((selectedDate) => {
			return selectedDate.toDateString() !== date.toDateString();
		});
	}

	/**
	 * Go to the next month
	 */
	goToNextMonth(): void {
		if (this.options.animate || this.options.numberOfMonths > 1) {
			if (this.isAnimating) {
				return;
			}

			this.months = this.getNextMonthArray(this.month, this.year);

			if (this.options.animate) {
				this.setDatepickerHeight();
				this.slideLeft();
			}

		} else {

			this.month = this.getNextMonth(this.month);
			this.year = this.getYearOfNextMonth(this.month, this.year);
			this.currentMonthYear = [{'month': this.month, 'year': this.year}]
			this.months = this.createCalendarArray(this.year, this.month);

		}
	}

	/**
	 * Go to the previous month
	 */
	goToPreviousMonth(): void {
		if (this.options.animate || this.options.numberOfMonths > 1) {
			if (this.isAnimating) {
				return;
			}

			this.months = this.getPreviousMonthArray(this.month, this.year);

			if (this.options.animate) {
				this.setDatepickerHeight(true);
				this.slideRight();
			}
		} else {
			this.month = this.getPreviousMonth(this.month);
			this.year = this.getYearOfPreviousMonth(this.month, this.year);
			this.months = this.createCalendarArray(this.year, this.month);
		}
	}

	slideRight(): void {
		this.setIsAnimating();
		setTimeout(() => {
			this.transition = 'transform ' + this.options.animationSpeed + 'ms ' + this.options.easing;
			this.translateX = 50;
		}, 1);

	}

	slideLeft(): void {
		this.setIsAnimating();
		setTimeout(() => {
			this.transition = 'transform ' + this.options.animationSpeed + 'ms ' + this.options.easing;
			this.translateX = -50;
		}, 100);
	}

	setIsAnimating(): void {
		this.isAnimating = true;
		setTimeout(() => {
			this.isAnimating = false;
		}, this.options.animationSpeed);
	}

	close(): void {
		this.isOpen = false;
	}

	selectStartDate(): void {
		this.selectedRange = 'startDate';
	}

	selectEndDate(): void {
		this.selectedRange = 'endDate';
	}

	getYearOfNextMonth(month: number, year: number): number {
		return month === 11 ? year + 1 : year;
	}

	getNextMonth(month: number): number {
		return month === 11 ? 0 : month + 1;
	}

	getYearOfPreviousMonth(month: number, year: number): number {
		return month === 0 ? year - 1 : year;
	}

	getPreviousMonth(month: number): number {
		return month === 0 ? 11 : month - 1;
	}

	isStartDate(date: Date): boolean {
		return this.startDate && date.toDateString() === this.startDate.toDateString();
	}

	isEndDate(date: Date): boolean {
		return this.endDate && date.toDateString() === this.endDate.toDateString();
	}

	isToday(date: Date): boolean {
		return date.toDateString() === this.today.toDateString();
	}

	isLater(date: Date, compareDate: Date): boolean {
		return date > compareDate
	}

	isEarlier(date: Date, compareDate: Date): boolean {
		return date < compareDate
	}

	isLaterThenSelected(date: Date): boolean {
		return;
	}

	isSelected(date: Date): boolean {
		return (this.selectedDates
			.map(date => date.toDateString())
			.indexOf(date.toDateString()) !== -1);
	}

	isDisabled(date: Date): boolean {
		return (date < this.options.max && date > this.options.min);
	}

	isInRange(date: Date): boolean {
		return this.startDate && this.endDate && this.startDate < date && date < this.endDate;
	}

	getDaysInMonth(year: number, month: number): number {
		return [31, this.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	}

	isLeapYear(year: number): boolean {
		return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
	}

	// TODO: maybe add clear undefined, not sure why though
	clearUndefined() {
	}
}