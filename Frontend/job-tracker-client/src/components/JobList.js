import React, { useEffect, useState } from 'react';
import axios from 'axios';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [isEditing, setIsEditing] = useState(false); // For editing mode
    const [editJob, setEditJob] = useState(null); // The job being edited

    const statusLabels = { // Mapping of status enum values to labels
        0: "Application Needed",
        1: "Applied",
        2: "Exam Center",
        3: "Interviewing",
        4: "Awaiting Offer"
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get('https://localhost:7116/api/jobapplications');
                setJobs(response.data);
            } catch (error) {
                console.error('Error fetching job applications:', error);
            }
        };

        fetchJobs();
    }, []);

    // Function to format the deadline as a readable date
    const formatDate = (dateString) => {
        
        return dateString.split('T')[0];
    };
    

    const deleteJob = async (id) => {
        try {
            await axios.delete(`https://localhost:7116/api/jobapplications/${id}`);
            setJobs(jobs.filter(job => job.id !== id)); // Update the state to remove the deleted job
            alert('Job application deleted successfully');
        } catch (error) {
            console.error('Error deleting job application:', error);
        }
    };

    // Handle the editing process
    const handleEditClick = (job) => {
        setIsEditing(true);
        setEditJob(job);
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        console.log("Job data being sent for update:", editJob);
        try {
            // Send PUT request to update the job
            await axios.put(`https://localhost:7116/api/jobapplications/${editJob.id}`, editJob);
            // Update the jobs list with the updated job
            setJobs(jobs.map(job => (job.id === editJob.id ? editJob : job)));
            setIsEditing(false);
            setEditJob(null);
            alert('Job application updated successfully!');
        } catch (error) {
            console.error('Error updating job application:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        // If the status field is being updated, convert the value to a number
        if (name === 'status') {
            setEditJob({ ...editJob, [name]: parseInt(value, 10) }); // Convert status to a number
        } else {
            setEditJob({ ...editJob, [name]: value });
        }
    };
    

    return (
        <div>
            <h2>Job Applications</h2>
            <ul>
                {jobs.map((job) => (
                    <li key={job.id}>
                        {job.position} at {job.companyName} - Status: {statusLabels[job.status]} - Deadline: {formatDate(job.deadline)}
                        <button onClick={() => deleteJob(job.id)} style={{ marginLeft: '10px' }}>Delete</button>
                        <button onClick={() => handleEditClick(job)} style={{ marginLeft: '10px' }}>Edit</button>
                    </li>
                ))}
            </ul>

            {/* Render the edit form if a job is being edited */}
            {isEditing && editJob && (
                <div>
                    <h3>Edit Job Application</h3>
                    <form onSubmit={handleUpdateJob}>
                        <div>
                            <label>Company Name:</label>
                            <input
                                type="text"
                                name="companyName"
                                value={editJob.companyName}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Position:</label>
                            <input
                                type="text"
                                name="position"
                                value={editJob.position}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Status:</label>
                            <select
                                name="status"
                                value={editJob.status}
                                onChange={handleChange}
                            >
                                <option value={0}>Application Needed</option>
                                <option value={1}>Applied</option>
                                <option value={2}>Exam Center</option>
                                <option value={3}>Interviewing</option>
                                <option value={4}>Awaiting Offer</option>
                            </select>
                        </div>
                        <div>
                            <label>Deadline:</label>
                            <input
                                type="date"
                                name="deadline"
                                value={formatDate(editJob.deadline)}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Notes:</label>
                            <textarea
                                name="notes"
                                value={editJob.notes}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit">Update Job</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default JobList;
