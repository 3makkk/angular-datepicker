import {Options} from './datepicker-options.model'

export interface DirectiveOptions {
	appendToBody: boolean; // Append the body, default false
	openDirection: string; // Direction the datepicker should be opend to
	closeOnBlur: boolean; // Close the datepicker onBlur
}
