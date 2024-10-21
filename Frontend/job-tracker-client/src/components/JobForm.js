import React, { useState } from 'react';
import axios from 'axios';

const JobForm = () => {
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState(0); // Default to ApplicationNeeded (0)
    const [deadline, setDeadline] = useState(''); // Updated from dateApplied to deadline
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newJob = {
            companyName,
            position,
            status,    // Send the numeric value for status
            deadline,
            notes
        };

        console.log(newJob);

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
                <select value={status} onChange={(e) => setStatus(parseInt(e.target.value))} required>
                    <option value={0}>Application Needed</option>
                    <option value={1}>Applied</option>
                    <option value={2}>Exam Center</option>
                    <option value={3}>Interviewing</option>
                    <option value={4}>Awaiting Offer</option>
                </select>
            </div>
            <div>
                <label>Deadline:</label> {/* Changed from Date Applied */}
                <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)} // Update the value and state
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
