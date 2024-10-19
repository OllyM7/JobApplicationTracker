import React from 'react';
import JobList from './components/JobList';
import JobForm from './components/JobForm';

function App() {
    return (
        <div>
            <h1>Job Application Tracker</h1>
            <JobForm />
            <JobList />
        </div>
    );
}

export default App;
