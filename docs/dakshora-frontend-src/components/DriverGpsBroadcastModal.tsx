import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Square, 
  Radio, 
  MapPin, 
  Gauge, 
  Smartphone, 
  Navigation2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Zap
} from 'lucide-react';

interface DriverGpsBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId?: string;
  routeNumber?: string;
  routeName?: string;
  driverName?: string;
  vehicleNumber?: string;
}

const DELHI_WAYPOINTS = [
  { lat: 28.5355, lng: 77.1557, name: 'Sector B Pocket 10, Vasant Kunj' },
  { lat: 28.5220, lng: 77.1580, name: 'Vasant Kunj Main Flyover' },
  { lat: 28.5080, lng: 77.1600, name: 'MG Road Junction' },
  { lat: 28.4988, lng: 77.1615, name: 'Sultanpur Metro Station' },
  { lat: 28.5100, lng: 77.1720, name: 'Mehrauli Andheria Mor' },
  { lat: 28.5244, lng: 77.1855, name: 'Qutab Minar Crossing' },
  { lat: 28.5260, lng: 77.2020, name: 'Press Enclave Marg' },
  { lat: 28.5284, lng: 77.2185, name: 'Saket District Centre' },
  { lat: 28.5330, lng: 77.1900, name: 'Saket - Vasant Kunj Link Road' },
  { lat: 28.5385, lng: 77.1575, name: 'Dakshora Academy Campus Gate 1' }
];

export const DriverGpsBroadcastModal: React.FC<DriverGpsBroadcastModalProps> = ({
  isOpen,
  onClose,
  routeId = 'tr-01',
  routeNumber = 'BUS-01',
  routeName = 'Vasant Kunj & Saket Campus Express',
  driverName = 'Jagdish Chandra',
  vehicleNumber = 'DL 1P C 4521'
}) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Standby — Ready to broadcast');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat: 28.5355, lng: 77.1557 });
  const [speed, setSpeed] = useState(0);
  const [pingsSent, setPingsSent] = useState(0);
  const [accuracy, setAccuracy] = useState(4);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const geoWatchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simIndexRef = useRef(0);

  // Send GPS telemetry ping to backend
  const sendPing = async (lat: number, lng: number, spd: number, acc: number = 4) => {
    try {
      const res = await fetch('/api/erp/transport/driver-gps/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId,
          lat,
          lng,
          speed: spd,
          accuracy: acc,
          heading: 85
        })
      });
      const data = await res.json();
      if (data.success) {
        setPingsSent(prev => prev + 1);
        setStatusMessage(`GPS Ping #${pingsSent + 1} broadcasted successfully (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (_e) {
      // Tolerate temporary connection drops
    }
  };

  // 1. Start Real Mobile Phone GPS Broadcasting
  const startRealPhoneGps = async () => {
    setErrorMsg(null);
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your current browser.');
      return;
    }

    try {
      // Notify backend that driver has started route
      await fetch('/api/erp/transport/driver-gps/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, status: 'on_route', driverName, vehicleNumber })
      });

      setIsBroadcasting(true);
      setIsSimulating(false);
      setStatusMessage('Acquiring phone GPS satellite fix...');

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const spd = Math.round((position.coords.speed || 0) * 3.6); // m/s to km/h
          const acc = Math.round(position.coords.accuracy || 4);

          setCurrentCoords({ lat, lng });
          setSpeed(spd);
          setAccuracy(acc);
          sendPing(lat, lng, spd, acc);
        },
        (err) => {
          setErrorMsg(`GPS Error: ${err.message}. If testing indoors, click 'Simulate Street Drive' below!`);
          setIsBroadcasting(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );

      geoWatchIdRef.current = watchId;
    } catch (err: any) {
      setErrorMsg(`Failed to initiate route: ${err.message}`);
    }
  };

  // 2. Start Street Simulator for Desktop / Indoor Testing
  const startSimulator = async () => {
    setErrorMsg(null);
    try {
      await fetch('/api/erp/transport/driver-gps/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, status: 'on_route', driverName, vehicleNumber })
      });

      setIsBroadcasting(false);
      setIsSimulating(true);
      simIndexRef.current = 0;

      const runStep = () => {
        const pt = DELHI_WAYPOINTS[simIndexRef.current];
        const randomSpeed = Math.floor(Math.random() * 15) + 28; // 28 - 43 km/h
        setCurrentCoords({ lat: pt.lat, lng: pt.lng });
        setSpeed(randomSpeed);
        setAccuracy(3);
        sendPing(pt.lat, pt.lng, randomSpeed, 3);
        setStatusMessage(`Simulator driving passing: ${pt.name}`);

        simIndexRef.current = (simIndexRef.current + 1) % DELHI_WAYPOINTS.length;
      };

      runStep();
      simTimerRef.current = setInterval(runStep, 3500);
    } catch (err: any) {
      setErrorMsg(`Simulator error: ${err.message}`);
    }
  };

  // Stop broadcasting / Complete route
  const stopBroadcasting = async () => {
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
    if (simTimerRef.current !== null) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    setIsBroadcasting(false);
    setIsSimulating(false);
    setSpeed(0);
    setStatusMessage('Route completed / Bus parked at depot');

    try {
      await fetch('/api/erp/transport/driver-gps/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, status: 'completed' })
      });
    } catch (_e) {}
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
      if (simTimerRef.current !== null) {
        clearInterval(simTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const isActive = isBroadcasting || isSimulating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Driver Mobile GPS Console
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                100% Real Live Bus GPS Tracking • Zero Cost Phone App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Route Details Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">ASSIGNED ROUTE</span>
            <span className="text-white font-bold">{routeNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">VEHICLE REG</span>
            <span className="text-cyan-400 font-bold">{vehicleNumber}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-slate-400 block uppercase">BUS CAPTAIN</span>
            <span className="text-slate-200">{driverName}</span>
          </div>
        </div>

        {/* Live Broadcast Telemetry Display */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-xs font-mono font-bold text-white">
                {isActive ? (isSimulating ? 'SIMULATOR ACTIVE' : 'LIVE PHONE GPS BROADCASTING') : 'STANDBY (READY)'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Pings: {pingsSent}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono">SPEED</span>
              <span className="text-lg font-black text-white font-mono">{speed}</span>
              <span className="text-[9px] text-slate-400 block font-mono">km/h</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono">ACCURACY</span>
              <span className="text-lg font-black text-cyan-300 font-mono">±{accuracy}</span>
              <span className="text-[9px] text-slate-400 block font-mono">meters</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono">INTERVAL</span>
              <span className="text-lg font-black text-emerald-300 font-mono">3.5</span>
              <span className="text-[9px] text-slate-400 block font-mono">sec</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400 shrink-0 animate-pulse" />
            <span className="truncate">{statusMessage}</span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Driver Action Buttons */}
        <div className="space-y-3">
          {!isActive ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={startRealPhoneGps}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Phone GPS</span>
              </button>

              <button
                onClick={startSimulator}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Simulate Drive</span>
              </button>
            </div>
          ) : (
            <button
              onClick={stopBroadcasting}
              className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>End Route / Stop Broadcast</span>
            </button>
          )}

          <p className="text-[11px] text-slate-400 text-center font-sans">
            Tip: Click <b>Simulate Drive</b> to see the bus travel along Delhi roads in real time without being physically inside a bus.
          </p>
        </div>
      </div>
    </div>
  );
};
