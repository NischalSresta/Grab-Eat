import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableService } from '../../services/table.service';
import type { CreateBookingRequest } from '../../types/table.types';

type BookingForm = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  specialRequests: string;
};

const TableBooking = () => {
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: '',
    specialRequests: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      guests: Number(formData.guests) || 1,
      specialRequests: formData.specialRequests,
    } as unknown as CreateBookingRequest;

    await tableService.createBooking(payload);

    const msg = 'Table has been booked or reserved.';
    sessionStorage.setItem('tableBookingNotice', msg);
    window.dispatchEvent(new CustomEvent('table-booked', { detail: { message: msg } }));

    navigate('/my-bookings');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div>
      <h2>Book a Table</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="phone">Phone</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="date">Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="time">Time</label>
          <input type="time" name="time" value={formData.time} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="guests">Number of Guests</label>
          <input type="number" name="guests" value={formData.guests} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="specialRequests">Special Requests</label>
          <input type="text" name="specialRequests" value={formData.specialRequests} onChange={handleInputChange} />
        </div>
        <button type="submit">Book Table</button>
      </form>
    </div>
  );
};

export default TableBooking;