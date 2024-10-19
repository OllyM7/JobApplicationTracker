import React, { useState } from 'react';
import axios from 'axios';

const JobForm = () => {
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('');
    const [dateApplied, setDateApplied] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newJob = { companyName, position, status, dateApplied, notes };

        try {
            await axios.post('https://localhost:7116/api/jobapplications', newJob);
            alert('Job application added successfully!');
        } catch (error) {
            console.error('Error adding job application:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Company Name:</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Position:</label>
                <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Status:</label>
                <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Date Applied:</label>
                <input
                    type="date"
                    value={dateApplied}
                    onChange={(e) => setDateApplied(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Notes:</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>
            <button type="submit">Add Job</button>
        </form>
    );
};

export default JobForm;
