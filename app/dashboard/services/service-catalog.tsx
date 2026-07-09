"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/services/CheckoutButton";
import { Folder, FolderOpen, Briefcase, ChevronRight, CheckCircle2, FileText, ArrowLeft, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ServiceCatalog({ categories }: { categories: any[] }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

    const activeCategory = categories.find(c => c.id === selectedCategoryId);
    const activeSubCategory = activeCategory?.subCategories.find((s: any) => s.id === selectedSubCategoryId);
    const activeService = activeSubCategory?.services.find((s: any) => s.id === selectedServiceId);

    // Initial State: Show Categories
    if (!selectedCategoryId) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.id} className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group" onClick={() => setSelectedCategoryId(category.id)}>
                        <CardHeader className="pb-4">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Folder className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{category.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2">{category.description || "Explore compliance and tax services"}</CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            <span>{category.subCategories.length} Types</span>
                            <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </CardFooter>
                    </Card>
                ))}
                {categories.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        No active service categories available.
                    </div>
                )}
            </div>
        );
    }

    // Level 2: SubCategories
    if (!selectedSubCategoryId) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => setSelectedCategoryId(null)} className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{activeCategory?.name}</h2>
                    <p className="text-muted-foreground mt-1">{activeCategory?.description}</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeCategory?.subCategories.map((sub: any) => (
                        <Card key={sub.id} className="cursor-pointer hover:border-indigo-500/50 transition-all hover:shadow-md group" onClick={() => setSelectedSubCategoryId(sub.id)}>
                            <CardHeader className="pb-4">
                                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-5 h-5 text-indigo-500" />
                                </div>
                                <CardTitle className="text-lg">{sub.name}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-2">{sub.description || "Sub-category services"}</CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                <span>{sub.services.length} Services</span>
                                <ChevronRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </CardFooter>
                        </Card>
                    ))}
                    {activeCategory?.subCategories.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                            Coming soon to this category.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Level 3: Services
    if (!selectedServiceId) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => setSelectedSubCategoryId(null)} className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to {activeCategory?.name}
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <span className="text-muted-foreground/60 font-normal">{activeCategory?.name} /</span> {activeSubCategory?.name}
                    </h2>
                    <p className="text-muted-foreground mt-1">{activeSubCategory?.description}</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                    {activeSubCategory?.services.map((service: any) => (
                        <Card key={service.id} className="cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-md group flex flex-col" onClick={() => setSelectedServiceId(service.id)}>
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                                        {service.slaHours} HR SLA
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-2 font-medium">{service.description || "Specific compliance service"}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 text-sm mt-auto mb-2 text-muted-foreground">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span>{service.requiredDocuments.length} required documents</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {service.plans.length > 0 ? (
                                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-none transition-colors">
                                            {service.plans.length} plan{service.plans.length !== 1 && 's'} available
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50">Custom Pricing</Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-dashed bg-slate-50/50 dark:bg-slate-900/20 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/10 transition-colors">
                                <div className="w-full flex items-center justify-between font-black text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                    <span>Select Service</span>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                    {activeSubCategory?.services.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                            No services active in this category.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Level 4: Plans
    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => setSelectedServiceId(null)} className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
            </Button>
            
            <div className="flex items-start justify-between gap-8 mb-8">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">{activeService?.name}</h2>
                    <p className="text-muted-foreground mt-2 text-lg max-w-3xl leading-relaxed">{activeService?.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Plans */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" /> Choose a Tier
                    </h3>
                    
                    <div className="grid gap-6 sm:grid-cols-2">
                        {activeService?.plans.map((plan: any) => (
                            <Card key={plan.id} className="flex flex-col relative overflow-hidden group hover:border-primary/50 transition-all hover:shadow-xl">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:opacity-100 opacity-0 transition-opacity" />
                                <CardHeader className="pb-4">
                                    <Badge className="w-fit mb-4 bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">{plan.planName}</Badge>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black tracking-tighter">₹{plan.price.toLocaleString()}</span>
                                    </div>
                                    <CardDescription className="mt-3 leading-relaxed text-sm">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto pt-4 border-t border-dashed bg-slate-50/50 dark:bg-slate-900/50">
                                    <CheckoutButton 
                                        serviceId={activeService.id}
                                        planId={plan.id}
                                        title={`${activeService.name} - ${plan.planName}`}
                                        amount={Math.round(plan.price * 100)}
                                    />
                                    {plan.turnaroundTime && (
                                        <p className="text-center text-xs text-muted-foreground font-medium mt-4 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                                            <Clock className="w-3.5 h-3.5" /> EST. {plan.turnaroundTime}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {activeService?.plans.length === 0 && (
                            <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/20">
                                <p className="font-bold mb-1">Pricing Configuration Pending</p>
                                <p className="text-sm">Please contact support for {activeService?.name}.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Information Panel */}
                <div className="space-y-6">
                    <Card className="shadow-none border-dashed bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Prerequisite Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeService?.requiredDocuments.length > 0 ? (
                                <ul className="space-y-3">
                                    {activeService.requiredDocuments.map((doc: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <span className="leading-snug">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground font-medium italic">No special documents required to initiate.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border-dashed bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Service Level Agreement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium leading-relaxed text-amber-800/80 dark:text-amber-200/80">
                                We guarantee an initial turnaround or status update within <strong className="font-black text-amber-900 dark:text-amber-400">{activeService?.slaHours} hours</strong> of successful payment and document submission.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
