import React, { useEffect, useState } from 'react';
import axios from 'axios';

const JobList = () => {
    const [jobs, setJobs] = useState([]);

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

    return (
        <div>
            <h2>Job Applications</h2>
            <ul>
                {jobs.map((job) => (
                    <li key={job.id}>
                        {job.position} at {job.companyName} - Status: {job.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default JobList;
