'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Loader from '@/components/ui/Loader';
import CustomSelect from '@/components/ui/CustomSelect';
import { Save, Plus, Trash, Calendar, Clock, MapPin } from 'lucide-react';
import PasswordModal from '@/components/ui/PasswordModal';
import { useRouter } from 'next/navigation';

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

const CATEGORIES = ['Men', 'Women', 'Mixed'];

interface Team {
    id: string;
    name: string;
}

interface Match {
    id: string;
    sport: string;
    category: string;
    teamA: string;
    teamB: string;
    date: string;
    time: string;
    venue: string;
}

export default function ManageSchedule() {
    const [schedule, setSchedule] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState<string>("");
    const [filterSport, setFilterSport] = useState<string>("All");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState<((password: string) => Promise<boolean>) | null>(null);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) router.push('/admin/login');

        const fetchData = async () => {
            try {
                const [scheduleRes, teamsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`)
                ]);

                const scheduleData = await scheduleRes.json();
                const teamsData = await teamsRes.json();

                // Ensure all matches have required fields
                const sanitizedSchedule = scheduleData.map((match: any) => ({
                    ...match,
                    date: match.date || '',
                    time: match.time || '',
                    venue: match.venue || '',
                    category: match.category || 'Men'
                }));

                setSchedule(sanitizedSchedule);
                setTeams(teamsData);
                if (sanitizedSchedule.length > 0) {
                    setSelectedMatchId(sanitizedSchedule[0].id);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSaveClick = () => {
        for (const match of schedule) {
            if (!match.teamA || !match.teamB) {
                alert(`Match between ${match.teamA || 'Unknown'} and ${match.teamB || 'Unknown'} must have both teams selected.`);
                return;
            }
            if (match.teamA === match.teamB) {
                alert(`Team A and Team B cannot be the same for match between ${match.teamA} and ${match.teamB}.`);
                return;
            }
            if (!match.date || !match.time || !match.venue) {
                alert(`Date, Time, and Venue are required for match between ${match.teamA} and ${match.teamB} (${match.sport}).`);
                return;
            }
        }
        setConfirmCallback(() => handleConfirmSave);
        setIsPasswordModalOpen(true);
    };

    const handleConfirmSave = async (password: string): Promise<boolean> => {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password
                },
                body: JSON.stringify(schedule),
            });

            if (res.ok) {
                alert('Schedule saved successfully!');
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const addMatch = () => {
        const newId = Date.now().toString();
        const newMatch = {
            id: newId,
            sport: 'Football',
            category: 'Men',
            teamA: teams[0]?.name || '',
            teamB: teams[1]?.name || '',
            date: '',
            time: '',
            venue: ''
        };

        setSchedule([newMatch, ...schedule]);
        setSelectedMatchId(newId);
    };

    const updateMatch = (index: number, field: string, value: string) => {
        setSchedule(prevSchedule => {
            const newSchedule = [...prevSchedule];
            newSchedule[index] = { ...newSchedule[index], [field]: value };
            return newSchedule;
        });
    };

    const removeMatchClick = (index: number) => {
        if (index === -1) return;
        if (confirm('Are you sure you want to delete this match?')) {
            setConfirmCallback(() => (password: string) => handleConfirmRemoveMatch(index, password));
            setIsPasswordModalOpen(true);
        }
    };

    const handleConfirmRemoveMatch = async (index: number, password: string) => {
        setIsPasswordModalOpen(false);
        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);
        setSchedule(newSchedule);

        // Determine next selection
        let nextMatch = newSchedule[index];
        if (!nextMatch) {
            nextMatch = newSchedule[index - 1];
        }

        if (nextMatch) {
            if (filterSport === "All" || nextMatch.sport === filterSport) {
                setSelectedMatchId(nextMatch.id);
            } else {
                const visibleMatches = newSchedule.filter(m => m.sport === filterSport);
                setSelectedMatchId(visibleMatches.length > 0 ? visibleMatches[0].id : "");
            }
        } else {
            setSelectedMatchId("");
        }

        // Save changes
        setSaving(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password
                },
                body: JSON.stringify(newSchedule),
            });
            alert('Match deleted successfully!');
        } catch (error) {
            console.error('Error deleting match:', error);
            alert('Failed to delete match.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    const selectedMatchIndex = schedule.findIndex(m => m.id === selectedMatchId);
    const selectedMatch = schedule[selectedMatchIndex];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Manage Schedule</h1>
                        <p className="text-slate-400">Create and edit match schedules</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={addMatch}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl flex items-center transition-all border border-white/10"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Add Match
                        </button>
                        <button
                            onClick={handleSaveClick}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="h-5 w-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <PasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onConfirm={(password) => confirmCallback ? confirmCallback(password) : Promise.resolve(false)}
                    onExceededAttempts={handleLogout}
                />

                {/* Match Selection - Two Step */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1: Filter by Sport */}
                    <div>
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">1. Filter by Sport</label>
                        <CustomSelect
                            value={filterSport}
                            onValueChange={(val) => {
                                setFilterSport(val);
                                // Auto-select first match of this sport
                                const matches = val === "All" ? schedule : schedule.filter(m => m.sport === val);
                                if (matches.length > 0) {
                                    setSelectedMatchId(matches[0].id);
                                } else {
                                    setSelectedMatchId("");
                                }
                            }}
                            placeholder="All Sports"
                            options={[
                                { value: "All", label: "All Sports" },
                                ...SPORTS.filter(s => schedule.some(m => m.sport === s)).map(s => ({ value: s, label: s }))
                            ]}
                        />
                    </div>
                    {/* Step 2: Select Match */}
                    <div className="md:col-span-2">
                        <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">2. Select Match</label>
                        <CustomSelect
                            value={selectedMatchId}
                            onValueChange={setSelectedMatchId}
                            placeholder="Select a Match"
                            options={(filterSport === "All" ? schedule : schedule.filter(m => m.sport === filterSport)).map((match: Match) => ({
                                value: match.id,
                                label: `${match.teamA} vs ${match.teamB} (${match.category === 'Women' ? 'W' : match.category === 'Men' ? 'M' : 'X'})${match.date ? ` • ${new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                            }))}
                        />
                        <p className="text-xs text-slate-500 mt-2">(M) = Men • (W) = Women • (X) = Mixed</p>
                    </div>
                </div>

                {selectedMatch ? (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="bg-black/30 p-6 border-b border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedMatch.sport}</h2>
                                        <p className="text-slate-400 text-sm mt-1">{selectedMatch.category} • {selectedMatch.teamA} vs {selectedMatch.teamB}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeMatchClick(selectedMatchIndex)}
                                    className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                    title="Delete Match"
                                >
                                    <Trash className="h-5 w-5" />
                                    <span className="hidden md:inline">Delete</span>
                                </button>
                            </div>
                        </div>

                        {/* Match Details */}
                        <div className="p-6 space-y-6">
                            {/* Sport & Category */}
                            <div>
                                <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4">Event Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Sport</label>
                                        <CustomSelect
                                            value={selectedMatch.sport}
                                            onValueChange={(val) => updateMatch(selectedMatchIndex, 'sport', val)}
                                            options={SPORTS.map(s => ({ value: s, label: s }))}
                                        />
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Category</label>
                                        <CustomSelect
                                            value={selectedMatch.category || 'Men'}
                                            onValueChange={(val) => updateMatch(selectedMatchIndex, 'category', val)}
                                            options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                        />
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedMatch.date || ''}
                                            onChange={(e) => updateMatch(selectedMatchIndex, 'date', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Time
                                        </label>
                                        <input
                                            type="time"
                                            value={selectedMatch.time || ''}
                                            onChange={(e) => updateMatch(selectedMatchIndex, 'time', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Teams */}
                            <div>
                                <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4">Teams</h3>
                                <div className="bg-gradient-to-r from-primary/5 via-transparent to-accent/5 p-6 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team A</label>
                                                <CustomSelect
                                                    value={selectedMatch.teamA}
                                                    onValueChange={(val) => updateMatch(selectedMatchIndex, 'teamA', val)}
                                                    placeholder="Select Team"
                                                    options={teams.filter((t: Team) => t.name !== selectedMatch.teamB).map((t: Team) => ({ value: t.name, label: t.name }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                                                <span className="text-slate-400 font-bold text-sm">VS</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Team B</label>
                                                <CustomSelect
                                                    value={selectedMatch.teamB}
                                                    onValueChange={(val) => updateMatch(selectedMatchIndex, 'teamB', val)}
                                                    placeholder="Select Team"
                                                    options={teams.filter((t: Team) => t.name !== selectedMatch.teamA).map((t: Team) => ({ value: t.name, label: t.name }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Venue */}
                            <div>
                                <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Venue
                                </h3>
                                <input
                                    value={selectedMatch.venue}
                                    onChange={(e) => updateMatch(selectedMatchIndex, 'venue', e.target.value)}
                                    className="w-full md:w-1/2 bg-black/20 border border-white/10 rounded-lg p-4 text-white focus:border-primary focus:outline-none transition-colors"
                                    placeholder="e.g. Main Ground, Basketball Court"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">
                            {schedule.length === 0 ? "No matches scheduled. Click 'Add Match' to start." : "Select a match from the dropdown to edit."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
