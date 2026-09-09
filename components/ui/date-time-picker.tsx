"use client";

import { DatePicker, type DatePickerProps } from "@/components/ui/date-picker";

export function DateTimePicker(props: Omit<DatePickerProps, "includeTime">) {
  return <DatePicker {...props} includeTime />;
}
