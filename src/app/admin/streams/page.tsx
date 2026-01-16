'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import { Save, Play, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';

// URL validation helper
const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty is valid (optional field)
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const SPORTS = [
    'Athletics',
    'Badminton',
    'Basketball',
    'Chess',
    'Cricket',
    'Football',
    'Squash',
    'Table Tennis',
    'Volleyball',
    'Weightlifting',
    'Powerlifting',
    'Tug of War'
];

export default function ManageStreams() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        const fetchData = async () => {
            try {
                const [scheduleRes, resultsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`)
                ]);

                const scheduleData = await scheduleRes.json();
                const resultsData = await resultsRes.json();

                // Merge both datasets - use a Map to avoid duplicates by id
                // Results data takes priority (may have updated stream info)
                const matchMap = new Map();

                // Add schedule matches first
                scheduleData.forEach((match: any) => {
                    matchMap.set(match.id, match);
                });

                // Add/override with results matches (they may have stream info already)
                resultsData.forEach((match: any) => {
                    matchMap.set(match.id, match);
                });

                setResults(Array.from(matchMap.values()));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results),
            });
            alert('Streams saved successfully!');
        } catch (error) {
            console.error('Error saving streams:', error);
            alert('Failed to save streams.');
        } finally {
            setSaving(false);
        }
    };

    const updateLiveLink = (id: string, field: string, value: string) => {
        const newResults = results.map(match => {
            if (match.id === id) {
                return { ...match, [field]: value };
            }
            return match;
        });
        setResults(newResults);
    };

    if (loading) return <Loader />;

    const filteredResults = results.filter(match => match.sport === selectedSport);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Manage Streams</h1>
                        <p className="text-muted-foreground">Add or update live stream links for matches</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="h-5 w-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Sport Selection Dropdown */}
                <div className="mb-8">
                    <label className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Filter by Sport</label>
                    <CustomSelect
                        value={selectedSport}
                        onValueChange={setSelectedSport}
                        options={SPORTS.map(sport => ({ value: sport, label: sport }))}
                        className="w-full md:w-1/3"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredResults.map((match) => (
                        <div key={match.id} className="bg-card backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-primary/50 transition-all flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded uppercase">{match.sport}</span>
                                    <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
                                        {match.category === 'Women' ? 'W' : match.category === 'Men' ? 'M' : 'X'}
                                    </span>
                                    <span className="text-muted-foreground text-sm">{match.date}</span>
                                </div>
                                <div className="text-xl font-bold text-foreground">
                                    {match.teamA} <span className="text-muted-foreground mx-2">vs</span> {match.teamB}
                                </div>
                            </div>

                            <div className="w-full md:w-1/2 space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block flex items-center">
                                        <Play className="h-3 w-3 mr-1" /> Live Stream URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <input
                                            value={match.liveLink || ''}
                                            onChange={(e) => updateLiveLink(match.id, 'liveLink', e.target.value)}
                                            className={`w-full bg-input border rounded-lg pl-10 pr-10 p-3 text-foreground focus:outline-none transition-colors ${match.liveLink && !isValidUrl(match.liveLink)
                                                ? 'border-destructive focus:border-destructive'
                                                : match.liveLink && isValidUrl(match.liveLink)
                                                    ? 'border-chart-3/50 focus:border-chart-3'
                                                    : 'border-border focus:border-primary'
                                                }`}
                                            placeholder="https://youtube.com/..."
                                        />
                                        {/* Validation indicator */}
                                        {match.liveLink && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                {isValidUrl(match.liveLink) ? (
                                                    <CheckCircle className="h-4 w-4 text-chart-3" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {match.liveLink && !isValidUrl(match.liveLink) && (
                                        <p className="text-destructive text-xs mt-1">Please enter a valid URL (e.g., https://youtube.com/...)</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                        Stream Status
                                    </label>
                                    <CustomSelect
                                        value={match.streamStatus || 'Ended'}
                                        onValueChange={(val) => updateLiveLink(match.id, 'streamStatus', val)}
                                        options={[
                                            { value: 'Ended', label: 'Ended / Not Live' },
                                            { value: 'Live', label: 'Live Now' },
                                            { value: 'Upcoming', label: 'Starting Soon' }
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredResults.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
                            No matches found for {selectedSport}.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
