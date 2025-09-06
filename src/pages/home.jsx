import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>
            {/* Navbar */}
            <div className="flex justify-between items-center px-8 py-4 bg-blue-700 text-white shadow-md">
                <div className="flex items-center">
                    <h2 className="text-2xl font-bold tracking-wide">Virtual Video Call</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <IconButton
                        onClick={() => navigate("/history")}
                        className="text-white"
                        size="large"
                    >
                        <RestoreIcon />
                    </IconButton>
                    <span className="font-medium">History</span>
                    <Button
                        onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                        variant="contained"
                        color="secondary"
                        className="!bg-red-600 !text-white"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row items-center justify-center min-h-[80vh] bg-gray-100">
                <div className="md:w-1/2 w-full flex flex-col items-center justify-center p-8">
                    <h2 className="text-3xl font-semibold mb-6 text-gray-800 text-center">
                        Providing Quality Video Call
                    </h2>
                    <div className="flex gap-4 w-full justify-center">
                        <TextField
                            onChange={e => setMeetingCode(e.target.value)}
                            id="outlined-basic"
                            label="Meeting Code"
                            variant="outlined"
                            className="bg-white"
                        />
                        <Button
                            onClick={handleJoinVideoCall}
                            variant="contained"
                            color="primary"
                            className="!bg-blue-600 !text-white"
                        >
                            Join
                        </Button>
                    </div>
                </div>
                <div className="md:w-1/2 w-full flex items-center justify-center p-8">
                    <img srcSet='/logo3.png' alt="Logo" className="max-w-xs w-full rounded-lg shadow-lg" />
                </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent)