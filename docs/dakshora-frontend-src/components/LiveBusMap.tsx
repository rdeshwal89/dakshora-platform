import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Bus, 
  Radio, 
  Compass, 
  MapPin, 
  Navigation, 
  Maximize2, 
  Minimize2, 
  Clock, 
  ShieldCheck, 
  Activity, 
  RefreshCw,
  PhoneCall
} from 'lucide-react';

export interface TransportStop {
  stopName: string;
  pickupTime: string;
  dropTime: string;
  lat?: number;
  lng?: number;
}

export interface LiveGpsData {
  latitude: number;
  longitude: number;
  speedKmH: number;
  heading?: number;
  accuracyM?: number;
  lastPingSecAgo?: number;
  lastPingTime?: string;
  statusText?: string;
}

export interface TransportDetails {
  id?: string;
  routeNumber?: string;
  routeName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  currentStatus?: string;
  isLive?: boolean;
  emergencySosContact?: string;
  stops?: TransportStop[];
  liveGps?: LiveGpsData;
  recentBreadcrumbs?: Array<{ lat: number; lng: number; timestamp?: string }>;
}

interface LiveBusMapProps {
  transport: TransportDetails;
  studentPickupStop?: string;
  onOpenDriverModal?: () => void;
}

export const LiveBusMap: React.FC<LiveBusMapProps> = ({
  transport,
  studentPickupStop,
  onOpenDriverModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const breadcrumbsPolylineRef = useRef<L.Polyline | null>(null);
  const stopsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState<LiveGpsData>({
    latitude: transport.liveGps?.latitude || 28.5355,
    longitude: transport.liveGps?.longitude || 77.1557,
    speedKmH: transport.liveGps?.speedKmH || 0,
    heading: transport.liveGps?.heading || 85,
    accuracyM: transport.liveGps?.accuracyM || 4,
    lastPingSecAgo: transport.liveGps?.lastPingSecAgo || 0,
    lastPingTime: transport.liveGps?.lastPingTime || new Date().toISOString(),
    statusText: transport.liveGps?.statusText || 'Scheduled / Idle at Depot'
  });
  const [isLiveStatus, setIsLiveStatus] = useState<boolean>(transport.isLive || transport.currentStatus === 'on_route');
  const [secondsSinceLastPing, setSecondsSinceLastPing] = useState(0);
  const [autoCenter, setAutoCenter] = useState(true);

  const routeId = transport.id || 'tr-01';

  // Helper to create modern DivIcon for Bus Marker
  const createBusIcon = useCallback((speed: number, heading: number, isLive: boolean) => {
    return L.divIcon({
      className: 'dakshora-bus-pin',
      html: `
        <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
          ${isLive ? `
            <div style="position: absolute; inset: -4px; border-radius: 9999px; background-color: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.25);"></div>
          ` : ''}
          <div style="
            position: relative; 
            width: 38px; 
            height: 38px; 
            border-radius: 12px; 
            background: linear-gradient(135deg, #0284c7, #0f766e); 
            border: 2px solid #ffffff; 
            box-shadow: 0 4px 14px rgba(0,0,0,0.4); 
            display: flex; 
            align-items: center; 
            justify-content: center;
            transform: rotate(${heading}deg);
            transition: transform 0.4s ease;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"/>
              <path d="M15 6v6"/>
              <path d="M2 12h19.6"/>
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.7 19.1 6 18 6H4C2.9 6 1.9 6.7 1.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
              <circle cx="7" cy="18" r="2"/>
              <path d="M9 18h5"/>
              <circle cx="16" cy="18" r="2"/>
            </svg>
          </div>
          <div style="
            position: absolute; 
            top: -12px; 
            padding: 1px 6px; 
            background: #0f172a; 
            border: 1px solid #06b6d4; 
            color: #38bdf8; 
            font-size: 10px; 
            font-weight: 800; 
            font-family: monospace; 
            border-radius: 9999px; 
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${speed > 0 ? `${speed} km/h` : 'STOPPED'}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = currentTelemetry.latitude || 28.5355;
      const initialLng = currentTelemetry.longitude || 77.1557;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter / OpenStreetMap tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Stops Layer Group
      const stopsGroup = L.layerGroup().addTo(map);
      stopsLayerGroupRef.current = stopsGroup;

      // Add stops if available
      const stops = transport.stops || [];
      const stopCoords: [number, number][] = [];

      stops.forEach((stop, index) => {
        const stopLat = stop.lat || (initialLat + (index * 0.008));
        const stopLng = stop.lng || (initialLng + (index * 0.012));
        stopCoords.push([stopLat, stopLng]);

        const isStudentStop = studentPickupStop && stop.stopName.toLowerCase().includes(studentPickupStop.toLowerCase());

        const stopIcon = L.divIcon({
          className: 'dakshora-stop-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <div style="
                width: 26px; 
                height: 26px; 
                border-radius: 9999px; 
                background: ${isStudentStop ? '#10b981' : '#1e293b'}; 
                border: 2px solid ${isStudentStop ? '#ffffff' : '#38bdf8'}; 
                color: #ffffff; 
                font-weight: 800; 
                font-size: 11px; 
                font-family: monospace; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              ">
                ${index + 1}
              </div>
              <div style="
                position: absolute; 
                top: 28px; 
                background: rgba(15, 23, 42, 0.9); 
                color: #e2e8f0; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 9px; 
                font-weight: 600; 
                white-space: nowrap; 
                pointer-events: none;
                border: 1px solid rgba(148, 163, 184, 0.2);
              ">
                ${stop.stopName.split(',')[0]}
              </div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([stopLat, stopLng], { icon: stopIcon }).addTo(stopsGroup);
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${stop.stopName}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Pickup: <b>${stop.pickupTime}</b> • Drop: <b>${stop.dropTime}</b>
            </div>
            ${isStudentStop ? '<div style="margin-top: 6px; color: #059669; font-weight: 700; font-size: 11px;">⭐ Your Designated Stop</div>' : ''}
          </div>
        `);
      });

      // Route Polyline
      if (stopCoords.length > 1) {
        polylineRef.current = L.polyline(stopCoords, {
          color: '#0284c7',
          weight: 4,
          opacity: 0.75,
          dashArray: '6, 8',
          lineCap: 'round'
        }).addTo(map);
      }

      // Breadcrumb polyline
      breadcrumbsPolylineRef.current = L.polyline([], {
        color: '#10b981',
        weight: 3,
        opacity: 0.85
      }).addTo(map);

      // Bus Marker
      const busMarker = L.marker([initialLat, initialLng], {
        icon: createBusIcon(currentTelemetry.speedKmH, currentTelemetry.heading || 85, isLiveStatus),
        zIndexOffset: 1000
      }).addTo(map);

      busMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px; padding: 4px;">
          <div style="font-size: 13px; font-weight: 800; color: #0284c7;">${transport.routeNumber || 'BUS-01'}</div>
          <div style="font-size: 11px; color: #334155;">${transport.routeName || 'School Bus Express'}</div>
          <div style="font-size: 11px; color: #0f172a; margin-top: 4px; font-family: monospace;">
            Driver: <b>${transport.driverName || 'Bus Captain'}</b><br/>
            Speed: <b>${currentTelemetry.speedKmH} km/h</b>
          </div>
        </div>
      `);

      busMarkerRef.current = busMarker;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount handled gracefully
    };
  }, []);

  // Poll live telemetry every 4 seconds from backend
  useEffect(() => {
    let isSubscribed = true;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/erp/transport/live-telemetry/${routeId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isSubscribed && data.success && data.telemetry) {
          const t = data.telemetry;
          setCurrentTelemetry({
            latitude: t.latitude,
            longitude: t.longitude,
            speedKmH: t.speedKmH || 0,
            heading: t.heading || 85,
            accuracyM: t.accuracyM || 4,
            lastPingSecAgo: t.lastPingSecAgo || 0,
            lastPingTime: t.lastPingTime,
            statusText: t.isLive 
              ? `Live on Route — Current Speed: ${t.speedKmH} km/h`
              : (t.status === 'on_route' ? 'Live on Route' : 'Scheduled / Idle at Depot')
          });
          setIsLiveStatus(t.isLive || t.status === 'on_route');
          setSecondsSinceLastPing(0);

          // Update map marker
          if (busMarkerRef.current) {
            const newPos: [number, number] = [t.latitude, t.longitude];
            busMarkerRef.current.setLatLng(newPos);
            busMarkerRef.current.setIcon(createBusIcon(t.speedKmH || 0, t.heading || 85, t.isLive || t.status === 'on_route'));

            if (autoCenter && mapInstanceRef.current) {
              mapInstanceRef.current.panTo(newPos, { animate: true, duration: 0.8 });
            }
          }

          // Update breadcrumbs
          if (breadcrumbsPolylineRef.current && t.recentBreadcrumbs && t.recentBreadcrumbs.length > 0) {
            const pts: [number, number][] = t.recentBreadcrumbs.map((b: { lat: number; lng: number }) => [b.lat, b.lng]);
            breadcrumbsPolylineRef.current.setLatLngs(pts);
          }
        }
      } catch (_err) {
        // Silently tolerate background poll hiccups
      }
    };

    const intervalId = setInterval(fetchTelemetry, 4000);
    // Initial fetch
    fetchTelemetry();

    // Ping ticker timer
    const tickerId = setInterval(() => {
      setSecondsSinceLastPing(prev => prev + 1);
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      clearInterval(tickerId);
    };
  }, [routeId, autoCenter, createBusIcon]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentTelemetry.latitude && currentTelemetry.longitude) {
      mapInstanceRef.current.setView([currentTelemetry.latitude, currentTelemetry.longitude], 15, { animate: true });
      setAutoCenter(true);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : ''}`}>
      {/* Top Map HUD Bar */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3.5 h-3.5 rounded-full ${isLiveStatus ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <div className={`absolute inset-0 w-3.5 h-3.5 rounded-full ${isLiveStatus ? 'bg-emerald-500' : 'bg-slate-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white font-mono">{transport.routeNumber || 'BUS-01'}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-cyan-400">{transport.vehicleNumber || 'DL 1P C 4521'}</span>
              {isLiveStatus ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL-TIME GPS BROADCAST
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  SCHEDULED / IDLE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md mt-0.5 font-sans">
              {transport.routeName || 'Vasant Kunj & Saket Campus Express'}
            </p>
          </div>
        </div>

        {/* Action Controls & Driver Console Trigger */}
        <div className="flex items-center gap-2">
          {onOpenDriverModal && (
            <button
              onClick={onOpenDriverModal}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>📱 Driver Phone Console</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className={`w-full bg-slate-950 ${isFullscreen ? 'h-[calc(100vh-210px)]' : 'h-[440px]'}`}
        />

        {/* Floating Map Action Buttons (Recenter / Zoom) */}
        <div className="absolute right-4 bottom-4 z-[400] flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              autoCenter 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/30' 
                : 'bg-slate-900/90 text-cyan-400 border-slate-700 hover:bg-slate-800'
            }`}
            title="Recenter on Bus"
          >
            <Compass className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md shadow-lg transition-colors cursor-pointer font-black text-sm"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md shadow-lg transition-colors cursor-pointer font-black text-sm"
            title="Zoom Out"
          >
            -
          </button>
        </div>

        {/* Floating Telemetry Badge Overlay (Bottom Left) */}
        <div className="absolute left-4 bottom-4 z-[400] p-3 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-xs font-mono shadow-xl max-w-sm">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE TELEMETRY</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {secondsSinceLastPing}s ago
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px]">CURRENT SPEED</span>
              <span className="text-white font-bold text-sm">
                {currentTelemetry.speedKmH} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">GPS ACCURACY</span>
              <span className="text-cyan-300 font-bold text-sm">
                ±{currentTelemetry.accuracyM || 4} <span className="text-xs font-normal text-slate-400">meters</span>
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300 truncate">
            {currentTelemetry.statusText || 'Broadcasting live phone GPS'}
          </div>
        </div>
      </div>

      {/* Bottom Route Status Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Next / Approaching Stop */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Approaching Stop</span>
            <h5 className="font-bold text-white truncate text-xs">
              {transport.stops?.[1]?.stopName || 'Sultanpur Metro Station, MG Road'}
            </h5>
            <span className="text-[10px] text-cyan-300 font-mono">
              ETA: ~6 mins ({transport.stops?.[1]?.pickupTime || '07:28 AM'})
            </span>
          </div>
        </div>

        {/* Bus Captain & Contact */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Bus Captain</span>
            <h5 className="font-bold text-white truncate text-xs">
              {transport.driverName || 'Jagdish Chandra'}
            </h5>
            <span className="text-[10px] text-slate-400 font-mono">
              Institutional Fleet
            </span>
          </div>
          <a
            href={`tel:${transport.driverPhone || '+919811055443'}`}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        </div>

        {/* Emergency SOS */}
        <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-rose-300 uppercase tracking-wider block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-rose-400" />
              <span>Transport Helpdesk</span>
            </span>
            <h5 className="font-bold text-rose-200 truncate text-xs">
              Campus Security & Safety
            </h5>
            <span className="text-[10px] text-rose-300/80 font-mono">
              24x7 SOS Hotline
            </span>
          </div>
          <a
            href={`tel:${transport.emergencySosContact || '+911126138900'}`}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <span>SOS</span>
          </a>
        </div>
      </div>
    </div>
  );
};
