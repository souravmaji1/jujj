// zoommeeting.js
'use client'

import { useEffect, useRef } from 'react';
import { ZoomMtg } from '@zoomus/websdk';

// Set the Zoom JS lib path

ZoomMtg.setZoomJSLib('https://source.zoom.us/2.17.0/lib', '/av'); // Updated to 2.17.0

export default function ZoomMeeting({ meetingNumber, password }) {
  const zoomContainerRef = useRef(null);

  useEffect(() => {
    if (!zoomContainerRef.current) return;

    const generateSignature = async (meetNum) => {
      // In production, this should be done server-side for security
      try {
        const response = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingNumber: meetNum,
            role: 0, // 0 for attendee
          }),
        });
        
        const data = await response.json();
        return data.signature;
      } catch (error) {
        console.error('Error generating signature:', error);
        return '';
      }
    };

    const initializeZoom = async () => {
      try {
        // Preload Zoom dependencies
        await ZoomMtg.preLoadWasm();
        await ZoomMtg.prepareWebSDK();
        
        // Get signature
        const numericMeetingNumber = parseInt(meetingNumber, 10);
        const signature = await generateSignature(numericMeetingNumber); // Pass numeric value
    
    
        
        // Configure Zoom meeting
        const meetConfig = {
          sdkKey: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
          meetingNumber: numericMeetingNumber, // Use numeric value
          passWord: password,
          userName: 'Devtest',
          userEmail: 'devwebtesting151@gmail.com',
          role: 0, // 0 for attendee
          signature: signature,
          success: (success) => {
            console.log('Zoom SDK initialized successfully:', success);
          },
          error: (error) => {
            console.error('Zoom SDK Error Details:', {
              errorCode: error.errorCode,
              message: error.message,
              meetingNumber: numericMeetingNumber,
              sdkKey: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
            });
          },
        };

        // Initialize Zoom SDK
        ZoomMtg.init({
          leaveUrl: window.location.origin,
          disableCORP: !window.crossOriginIsolated, // Handle CORP issues
          isSupportAV: true,
          success: () => {
            console.log('Zoom SDK initialized');
            
            // Join meeting after initialization
            ZoomMtg.join({
              ...meetConfig,
              success: () => {
                console.log('Joined meeting successfully');
              },
              error: (error) => {
                console.error('Failed to join meeting:', error);
              }
            });
          },
          error: (error) => {
            console.error('Zoom SDK initialization error:', error);
          }
        });
      } catch (error) {
        console.error('Zoom initialization error:', error);
      }
    };

    // Wait a moment to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeZoom();
    }, 1000);

    return () => {
      clearTimeout(timer);
      try {
        ZoomMtg.leaveMeeting({});
      } catch (e) {
        console.log('Error leaving meeting:', e);
      }
    };
  }, [meetingNumber, password]);

  return (
    <div className="w-full h-full">
      <div id="zmmtg-root" className="w-full h-full"></div>
      <div ref={zoomContainerRef} id="zoom-meeting-container" className="w-full h-full"></div>
    </div>
  );
}