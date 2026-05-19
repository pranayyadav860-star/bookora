// client/src/components/BookingCalendar.js
// FIXED - Shows bookings only on check-in date

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const BookingCalendar = ({ bookings, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Get bookings for a specific date - ONLY check-in date
  const getBookingsForDate = (date) => {
    if (!bookings || bookings.length === 0) return [];
    
    return bookings.filter(booking => {
      if (!booking.checkIn) return false;
      
      const checkInDate = new Date(booking.checkIn);
      const targetDate = new Date(date);
      
      // Reset time to compare dates only
      checkInDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      // Only match if check-in date equals target date
      return checkInDate.toDateString() === targetDate.toDateString();
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);
    setSelectedDate(clickedDate);
    if (onSelectDate) {
      onSelectDate(clickedDate);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50 rounded-lg border border-gray-100"></div>);
    }
    
    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const dayBookings = getBookingsForDate(date);
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`min-h-32 p-2 rounded-lg border cursor-pointer transition-all ${
            isSelected 
              ? "bg-yellow-500 text-white border-yellow-600 shadow-lg" 
              : isToday 
                ? "bg-blue-50 border-blue-300 hover:bg-blue-100" 
                : "bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md"
          }`}
        >
          <div className={`text-right font-semibold mb-2 ${isSelected ? "text-white" : "text-gray-700"}`}>
            {day}
            {isToday && !isSelected && <span className="text-xs ml-1 text-blue-500">Today</span>}
          </div>
          
          {dayBookings.length > 0 && (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {dayBookings.slice(0, 3).map((booking, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs p-1 rounded truncate ${
                    isSelected 
                      ? "bg-yellow-600 text-white" 
                      : "bg-green-100 text-gray-800 hover:bg-green-200"
                  }`}
                  title={booking.hotelName}
                >
                  🏨 {booking.hotelName?.substring(0, 18)}
                  {booking.hotelName?.length > 18 && '...'}
                </div>
              ))}
              {dayBookings.length > 3 && (
                <div className={`text-xs text-center ${isSelected ? "text-yellow-200" : "text-gray-500"}`}>
                  +{dayBookings.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  // Calculate total bookings for current month view
  const getTotalBookingsInMonth = () => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      total += getBookingsForDate(date).length;
    }
    return total;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {monthNames[month]} {year}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {getTotalBookingsInMonth()} check-ins this month
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {renderCalendarDays()}
      </div>

      {/* Legend & Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded border border-green-200"></div>
              <span>Has Check-ins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Selected Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Today</span>
            </div>
          </div>
          
          {selectedDate && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Selected: <span className="font-semibold">{selectedDate.toLocaleDateString()}</span>
              {' '}- {getBookingsForDate(selectedDate).length} check-ins
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;