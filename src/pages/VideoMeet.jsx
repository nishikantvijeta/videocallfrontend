import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

 let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    })

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

   
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    // For draggable local video
    const [localPos, setLocalPos] = useState({ x: 40, y: 40 });
    const dragging = useRef(false);

    const handleDragStart = (e) => {
        dragging.current = true;
        dragging.currentOffset = {
            x: e.clientX - localPos.x,
            y: e.clientY - localPos.y
        };
    };

    const handleDrag = (e) => {
        if (dragging.current) {
            setLocalPos({
                x: e.clientX - dragging.currentOffset.x,
                y: e.clientY - dragging.currentOffset.y
            });
        }
        if (menuDragging.current) {
            setMenuPos({
                x: e.clientX - menuDragging.currentOffset.x,
                y: e.clientY - menuDragging.currentOffset.y
            });
        }
    };

    const handleDragEnd = () => {
        dragging.current = false;
        menuDragging.current = false;
    };

    // For draggable menu bar
    const [menuPos, setMenuPos] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight - 120 });
    const menuDragging = useRef(false);

    const handleMenuDragStart = (e) => {
        menuDragging.current = true;
        menuDragging.currentOffset = {
            x: e.clientX - menuPos.x,
            y: e.clientY - menuPos.y
        };
    };

    // Clear chat handler
    const handleClearChat = () => {
        setMessages([]);
       
    };

    return (
        <div
            className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative overflow-hidden"
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
        >
            {askForUsername === true ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-2xl shadow-xl p-10 space-y-8 mx-auto mt-24 max-w-md">
                    <h2 className="text-2xl font-bold text-blue-700 mb-2">Enter into Lobby</h2>
                    <TextField
                        id="outlined-basic"
                        label="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        variant="outlined"
                        className="w-64 bg-white"
                        InputProps={{
                            style: { borderRadius: '0.5rem' }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={connect}
                        className="!bg-blue-600 !text-white !w-32 !h-12 !rounded-lg !shadow"
                    >
                        Connect
                    </Button>
                    <div className="mt-4">
                        <video ref={localVideoref} autoPlay muted className="rounded-lg shadow-lg w-64 h-40 bg-black" />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen w-full relative">
                    {/* Chat Modal */}
                    {showModal && (
                        <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col md:rounded-l-2xl">
                            <div className="flex justify-between items-center px-5 py-3 border-b bg-blue-100">
                                <h1 className="text-xl font-bold text-blue-700">Chat</h1>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleClearChat}
                                        className="!bg-red-600 !text-white !rounded-lg !px-3 !py-1 !text-xs hover:!bg-red-700"
                                    >
                                        Clear Chat
                                    </Button>
                                    <Button
                                        onClick={closeChat}
                                        className="!bg-blue-600 !text-white !rounded-lg !px-3 !py-1 !text-xs hover:!bg-blue-700"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-3">
                                {messages.length !== 0 ? messages.map((item, index) => (
                                    <div className="mb-6" key={index}>
                                        <p className="font-bold text-gray-700">{item.sender}</p>
                                        <p className="text-gray-600">{item.data}</p>
                                    </div>
                                )) : <p className="text-gray-400">No Messages Yet</p>}
                            </div>
                            <div className="flex items-center gap-3 px-5 py-4 border-t">
                                <TextField
                                    value={message}
                                    onChange={handleMessage}
                                    id="outlined-basic"
                                    label="Enter Your chat"
                                    variant="outlined"
                                    className="flex-1 bg-white"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault(); // Prevent sending on Enter
                                        }
                                    }}
                                />
                                <Button
                                    variant='contained'
                                    onClick={sendMessage}
                                    className="!bg-green-600 !text-white !rounded-lg hover:!bg-green-700"
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Remote Videos */}
                    <div className={
                        `transition-all duration-300 ${
                showModal ? 'md:pr-96' : ''
            } ${
                videos.length === 1
                    ? "flex items-center justify-center w-full h-screen"
                    : videos.length === 2
                        ? "grid grid-cols-2 gap-4 w-full h-screen"
                        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-screen"
            }`
                    }>
                        {videos.map((video) => (
                            <div key={video.socketId} className="flex items-center justify-center bg-black rounded-xl shadow-lg w-full h-full">
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    className="rounded-xl w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Local Video - Draggable Overlay */}
                    <div
                        className="absolute z-50 cursor-move"
                        style={{
                            left: localPos.x,
                            top: localPos.y,
                            width: '220px',
                            height: '140px'
                        }}
                        onMouseDown={handleDragStart}
                    >
                        <video
                            ref={localVideoref}
                            autoPlay
                            muted
                            className="rounded-xl shadow-2xl w-full h-full object-cover border-4 border-white"
                        />
                    </div>

                    {/* Controls - Draggable Menu Bar */}
                    <div
                        className="absolute z-50 flex gap-5 bg-blue-800 bg-opacity-95 backdrop-blur-md rounded-xl px-8 py-4 shadow-2xl border border-blue-300 cursor-move"
                        style={{
                            left: menuPos.x,
                            top: menuPos.y,
                        }}
                        onMouseDown={handleMenuDragStart}
                    >
                        <IconButton onClick={handleVideo} className="!text-white bg-blue-600 hover:bg-blue-800 rounded-full shadow">
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} className="!text-white !bg-red-600 hover:!bg-red-700 !rounded-full !shadow !border-2 !border-white">
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} className="!text-white bg-blue-600 hover:bg-blue-800 rounded-full shadow">
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable === true && (
                            <IconButton onClick={handleScreen} className="!text-white bg-blue-600 hover:bg-blue-800 rounded-full shadow">
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        )}
                       <IconButton onClick={() => setModal(!showModal)} className="!text-white bg-blue-600 hover:bg-blue-800 rounded-full shadow">
    <ChatIcon />
</IconButton>
                    </div>
                </div>
            )}
        </div>
    )
}