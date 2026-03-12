"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { type ITRFormData } from "../itr-wizard";
import { useITRWizard } from "../itr-wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Briefcase, Building, TrendingUp, HandCoins, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";

export function IncomeSourcesStep() {
    const { register, control, watch } = useFormContext<ITRFormData>();
    const { nextStep, prevStep } = useITRWizard();

    const hasBusinessIncome = watch("personal.hasBusinessIncome");

    // Field arrays for Capital Gains
    const { fields: stcgFields, append: appendStcg, remove: removeStcg } = useFieldArray({
        control,
        name: "income.capitalGains.shortTerm"
    });

    const { fields: ltcgFields, append: appendLtcg, remove: removeLtcg } = useFieldArray({
        control,
        name: "income.capitalGains.longTerm"
    });

    return (
        <div className="flex flex-col h-full">
            <div className="p-8 pb-6 border-b border-border/60">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Income Sources</h2>
                <p className="text-muted-foreground">Report your earnings from Salary, Property, Deals, and Business.</p>
            </div>

            <div className="p-8 flex-1 bg-muted/10">
                <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="salary">

                    {/* Salary */}
                    <AccordionItem value="salary" className="bg-card border border-border/60 rounded-xl px-4 shadow-sm">
                        <AccordionTrigger className="hover:no-underline font-semibold flex items-center gap-3">
                            <div className="flex items-center gap-3 w-full">
                                <div className="bg-primary/10 p-2 rounded-lg"><Briefcase className="h-5 w-5 text-primary" /></div>
                                <span>Income from Salary</span>
                                <span className="ml-auto mr-4 text-sm font-normal text-muted-foreground">
                                    ₹{Number(watch("income.salary") || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-6">
                            <div className="space-y-3 px-2">
                                <div className="space-y-3">
                                    <Label htmlFor="salaryIncome">Gross Salary (Before exemptions)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input id="salaryIncome" type="number" className="pl-8" {...register("income.salary", { valueAsNumber: true })} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="exemptAllowances">Exempt Allowances (HRA, LTA, etc.)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input id="exemptAllowances" type="number" className="pl-8" {...register("income.exemptAllowances", { valueAsNumber: true })} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Standard Deduction of ₹75,000 (New Regime) will be auto-applied.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* House Property */}
                    <AccordionItem value="house" className="bg-card border border-border/60 rounded-xl px-4 shadow-sm">
                        <AccordionTrigger className="hover:no-underline font-semibold">
                            <div className="flex items-center gap-3 w-full">
                                <div className="bg-primary/10 p-2 rounded-lg"><Building className="h-5 w-5 text-primary" /></div>
                                <span>Income from House Property</span>
                                <span className="ml-auto mr-4 text-sm font-normal text-muted-foreground">
                                    ₹{Number(watch("income.houseProperty") || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-6">
                            <div className="space-y-3 px-2">
                                <Label htmlFor="hpIncome">Rental Income (Annual)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input id="hpIncome" type="number" className="pl-8" {...register("income.houseProperty", { valueAsNumber: true })} />
                                </div>
                                <p className="text-[11px] text-muted-foreground">Enter net rental income after municipal taxes. 30% standard deduction will be applied internally.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Capital Gains */}
                    <AccordionItem value="cg" className="bg-card border border-border/60 rounded-xl px-4 shadow-sm">
                        <AccordionTrigger className="hover:no-underline font-semibold">
                            <div className="flex items-center gap-3 w-full">
                                <div className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-primary" /></div>
                                <span>Capital Gains</span>
                                <span className="ml-auto mr-4 text-sm font-normal text-muted-foreground">ITR-2/3 Applicable</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-6 space-y-6 px-2">

                            {/* Short Term */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Short Term Capital Gains (STCG)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendStcg({ saleValue: 0, buyValue: 0, expenses: 0 })}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Asset
                                    </Button>
                                </div>
                                {stcgFields.length === 0 && <p className="text-xs text-muted-foreground p-3 bg-muted rounded">No short term gains added.</p>}
                                {stcgFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-4 gap-2 items-end p-3 border border-border/40 rounded-lg">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase">Sale Value</Label>
                                            <Input type="number" {...register(`income.capitalGains.shortTerm.${index}.saleValue`, { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase">Buy Value</Label>
                                            <Input type="number" {...register(`income.capitalGains.shortTerm.${index}.buyValue`, { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase">Expenses</Label>
                                            <Input type="number" {...register(`income.capitalGains.shortTerm.${index}.expenses`, { valueAsNumber: true })} />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStcg(index)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {/* Long Term */}
                            <div className="space-y-3 pt-4 border-t border-border/60">
                                <div className="flex items-center justify-between">
                                    <Label>Long Term Capital Gains (LTCG)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendLtcg({ saleValue: 0, buyValue: 0, expenses: 0, assetType: "STOCKS" })}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Asset
                                    </Button>
                                </div>
                                {ltcgFields.length === 0 && <p className="text-xs text-muted-foreground p-3 bg-muted rounded">No long term gains added.</p>}
                                {ltcgFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-4 gap-2 items-end p-3 border border-border/40 rounded-lg">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase">Sale Value</Label>
                                            <Input type="number" {...register(`income.capitalGains.longTerm.${index}.saleValue`, { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase">Buy Value</Label>
                                            <Input type="number" {...register(`income.capitalGains.longTerm.${index}.buyValue`, { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase">Expenses</Label>
                                            <Input type="number" {...register(`income.capitalGains.longTerm.${index}.expenses`, { valueAsNumber: true })} />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLtcg(index)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Business & Profession - ONLY show if flag is true from Step 1 */}
                    {hasBusinessIncome && (
                        <AccordionItem value="business" className="bg-card border border-border/60 rounded-xl px-4 shadow-sm">
                            <AccordionTrigger className="hover:no-underline font-semibold">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="bg-primary/10 p-2 rounded-lg"><HandCoins className="h-5 w-5 text-primary" /></div>
                                    <span>Business & Profession</span>
                                    <span className="ml-auto mr-4 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">ITR-3 / 4</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-6 space-y-4 px-2">

                                <div className="space-y-1.5">
                                    <Label>Regular Business Net Profit</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input type="number" className="pl-8" {...register("income.businessProfession.regular", { valueAsNumber: true })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 p-4 border border-border/60 rounded-lg">
                                        <Label>Section 44AD (Business)</Label>
                                        <p className="text-[10px] text-muted-foreground mb-2">Presumptive taxation. Enter Gross Turnover.</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                            <Input type="number" className="pl-8" {...register("income.businessProfession.presumptive44AD", { valueAsNumber: true })} />
                                        </div>
                                        <p className="text-[10px] text-primary mt-1 font-medium">Profit assumed as 6% (Digital)</p>
                                    </div>

                                    <div className="space-y-1.5 p-4 border border-border/60 rounded-lg">
                                        <Label>Section 44ADA (Profession)</Label>
                                        <p className="text-[10px] text-muted-foreground mb-2">Freelancers & Professionals. Enter Gross Receipts.</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                            <Input type="number" className="pl-8" {...register("income.businessProfession.presumptive44ADA", { valueAsNumber: true })} />
                                        </div>
                                        <p className="text-[10px] text-primary mt-1 font-medium">Profit assumed as 50%</p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                </Accordion>
            </div>

            <div className="p-6 bg-card border-t border-border/60 flex justify-between items-center">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="gap-2">
                    Continue to Deductions <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
