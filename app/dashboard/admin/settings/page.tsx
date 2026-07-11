import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Bell, Globe, Database } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="font-serif text-[32px] text-foreground">
                        System Configuration
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight">
                        Fine-tuning the platform's <span className="text-primary font-bold">global operational parameters</span> and environment variables.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="general" className="gap-12 flex flex-col md:flex-row items-start">
                <TabsList className="grid grid-cols-2 md:grid-cols-1 gap-3 h-auto bg-transparent border-none p-0 w-full md:w-72 shrink-0">
                    <TabsTrigger value="general" className="w-full justify-start gap-3 px-6 py-4 rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-slate-500/20 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                        <Globe className="w-4 h-4" /> 
                        <span className="font-black text-[11px] uppercase tracking-widest">General Environment</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="w-full justify-start gap-3 px-6 py-4 rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-slate-500/20 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-muted-foreground">
                        <Shield className="w-4 h-4" /> 
                        <span className="font-black text-[11px] uppercase tracking-widest">Security Protocols</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="w-full justify-start gap-3 px-6 py-4 rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-slate-500/20 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-muted-foreground">
                        <Bell className="w-4 h-4" /> 
                        <span className="font-black text-[11px] uppercase tracking-widest">Notification Hooks</span>
                    </TabsTrigger>
                    <TabsTrigger value="api" className="w-full justify-start gap-3 px-6 py-4 rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-slate-500/20 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-muted-foreground">
                        <Database className="w-4 h-4" /> 
                        <span className="font-black text-[11px] uppercase tracking-widest">Hardware & API</span>
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 w-full max-w-3xl animate-in fade-in slide-in-from-right-4 duration-500">
                    <TabsContent value="general" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Platform Identity</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">Global Application Context</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid gap-3">
                                    <Label htmlFor="siteName" className="text-[10px] font-black uppercase tracking-[0.2em] pl-1 text-slate-500">Public Entity Name</Label>
                                    <Input id="siteName" defaultValue="TaxKosh" className="bg-slate-50 dark:bg-slate-800 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 h-14 font-black text-sm rounded-2xl transition-all" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="supportEmail" className="text-[10px] font-black uppercase tracking-[0.2em] pl-1 text-slate-500">Service Communication Node</Label>
                                    <Input id="supportEmail" defaultValue="support@taxkosh.com" className="bg-slate-50 dark:bg-slate-800 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 h-14 font-black text-sm rounded-2xl transition-all" />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button className="h-12 rounded-2xl px-10 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all font-black text-[10px] uppercase tracking-[0.2em] bg-slate-900 text-white dark:bg-white dark:text-slate-900">Synchronize State</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Access Control Polices</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">Authentication & Session Logic</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center justify-between p-8 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-3xl border-2 border-dashed border-emerald-100 dark:border-emerald-500/20">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
                                            <Shield className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-slate-900 dark:text-emerald-100 uppercase tracking-tight">Two-Factor Authentication</p>
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1 opacity-70">Enforce Hardware Key Validation</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="h-10 rounded-xl bg-white dark:bg-slate-800 border-none shadow-lg text-[10px] font-black uppercase tracking-widest px-8 text-emerald-600">Active</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Automated Dispatches</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">Email & Webhook Templates</CardDescription>
                            </CardHeader>
                            <CardContent className="p-20 text-center">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                                        <Bell className="w-8 h-8 text-slate-300 animate-bounce" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-black text-slate-400 text-sm uppercase tracking-widest">Template Logic Core Pending</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-primary transition-colors">Scheduled for Batch 2 rollout</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="api" className="mt-0 focus-visible:ring-0">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Third-Party Handshakes</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">Payment & Infrastructure Tokens</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] pl-1 text-slate-500">Razorpay Production Artifact</Label>
                                    <div className="relative group">
                                        <Input value="rzp_live_8k9L2m4J1P0vX" readOnly className="bg-slate-50 dark:bg-slate-800 border-none shadow-inner pr-24 h-14 font-mono text-xs font-black rounded-2xl" />
                                        <Button variant="ghost" className="absolute right-2 top-2 h-10 px-4 text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:bg-white dark:hover:bg-slate-700 transition-all rounded-xl">Cycle</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
