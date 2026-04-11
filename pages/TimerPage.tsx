import React from 'react';
import PomodoroTimer from '../components/PomodoroTimer';

const TimerPage: React.FC = () => {
    return (
        <div className="h-full w-full flex items-center justify-center p-4">
            <PomodoroTimer />
        </div>
    );
};

export default TimerPage;
