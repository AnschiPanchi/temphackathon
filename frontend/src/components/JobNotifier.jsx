import React, { useEffect, useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, X } from 'lucide-react';

const JobNotifier = () => {
    const { user, token } = useContext(AuthContext);
    const [popupAlert, setPopupAlert] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !token) return;

        const checkNotifications = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/jobs/notifications/${user._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                const unread = res.data.find(n => !n.read);
                if (unread) {
                    setPopupAlert(unread);
                }
            } catch (err) {
                console.error("Popup check failed", err);
            }
        };

        checkNotifications();
        
        const interval = setInterval(checkNotifications, 45000); // 45 sec poll
        return () => clearInterval(interval);
    }, [user, token]);

    const handleDismiss = async () => {
        if (!popupAlert) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/jobs/notifications/${popupAlert._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setPopupAlert(null);
        } catch (e) {
            setPopupAlert(null);
        }
    };

    const handleViewJob = () => {
        handleDismiss();
        navigate('/jobs');
    };

    if (!popupAlert) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid var(--violet-light)',
            animation: 'slideUpFade 0.4s ease-out', maxWidth: '350px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--violet-light)', fontWeight: 700 }}>
                    <Briefcase size={18} /> New Job Match Found!
                </div>
                <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={18} />
                </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {popupAlert.message || "A new job matching your profile has been successfully matched!"}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleViewJob}>View Job</button>
                <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>Dismiss</button>
            </div>
        </div>
    );
};

export default JobNotifier;
