"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, Plus, RefreshCw, Eye, CheckCircle, Clock, DollarSign,
  Download, BookMarked, Trash2, X, Edit2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchCompanySettings } from "@/lib/pdf/companySettings";
import type { CompanySettings } from "@/lib/pdf/companySettings";
import { downloadContractPDF, openContractPDF } from "@/lib/contract-pdf";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { fmtEur } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";

import type { Contract, Signer, CActivity, CComment, ContractStatus, ContractType, ContractVersion, ContractTemplate, DraftForm } from "./types";
import { gold, STATUS_CFG, TYPE_MAP, CONTRACT_TYPES } from "./constants";
import { buildContractText } from "./utils";
import { SignModal } from "./SignModal";
import { AIModal } from "./AIModal";
import { ContractCard } from "./ContractCard";
import { DashboardView } from "./DashboardView";
import { DetailPanel } from "./DetailPanel";
import { CreateModal } from "./CreateModal";

export default function ContratsPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const router = useRouter();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userName, setUserName] = useState("");

  const [view, setView] = useState<"list" | "dashboard">("list");
  const [selected, setSelected] = useState<Contract | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [activities, setActivities] = useState<CActivity[]>([]);
  const [comments, setComments] = useState<CComment[]>([]);

  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all");
  const [filterType, setFilterType] = useState<ContractType | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "client">("date");

  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [counterSigning, setCounterSigning] = useState(false);
  const [signerToSign, setSignerToSign] = useState<Signer | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [contractVersions, setContractVersions] = useState<ContractVersion[]>([]);
  const [prevEditContent, setPrevEditContent] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [tmplModal, setTmplModal] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [hasMoreContracts, setHasMoreContracts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const CONTRACT_SELECT = "id,user_id,title,client_name,client_email,client_company,contract_type,content,status,amount,currency,start_date,end_date,jurisdiction,language,duration_months,is_recurring,renewal_alert_days,specific_clauses,ai_summary,ai_risks,validation_manager,validation_legal,validation_finance,sent_at,viewed_at,expires_at,invoice_ref,project,created_at,updated_at";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
      setUserId(user.id);
      setUserEmail(user.email ?? undefined);
      const meta = user.user_metadata as Record<string, string> | undefined;
      setUserName(meta?.full_name ?? meta?.name ?? "");
      fetchCompanySettings().then(s => setCompanySettings(s)).catch(() => {});

      const [contractsRes, tmplRes] = await Promise.all([
        supabase.from("contracts").select(CONTRACT_SELECT).eq("user_id", user.id).order("created_at", { ascending: false }).limit(51),
        supabase.from("contract_templates").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (!contractsRes.error && contractsRes.data) {
        const rows = contractsRes.data as Contract[];
        if (rows.length > 50) { setHasMoreContracts(true); setContracts(rows.slice(0, 50)); }
        else { setHasMoreContracts(false); setContracts(rows); }
      }
      if (!tmplRes.error && tmplRes.data) setTemplates(tmplRes.data.map(r => ({ id: r.id as string, name: r.name as string, type: r.type as ContractType, content: r.content as string })));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected || !userId) return;
    setEditContent(selected.content ?? "");
    void (async () => { try { const { data } = await supabase.from("contract_versions").select("created_at,content").eq("contract_id", selected.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(5); if (data) setContractVersions(data.map(r => ({ ts: new Date(r.created_at as string).getTime(), content: r.content as string }))); } catch {} })();
    setPrevEditContent(null);
    setSigners([]);
    setActivities([]);
    setComments([]);
    Promise.all([
      supabase.from("contract_signatures").select("*").eq("contract_id", selected.id).eq("user_id", userId).order("order_index"),
      supabase.from("contract_activities").select("*").eq("contract_id", selected.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("contract_comments").select("*").eq("contract_id", selected.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]).then(([sigRes, actRes, comRes]) => {
      if (!sigRes.error && sigRes.data) setSigners(sigRes.data as Signer[]);
      if (!actRes.error && actRes.data) setActivities(actRes.data as CActivity[]);
      if (!comRes.error && comRes.data) setComments(comRes.data as CComment[]);
    }).catch(() => {
      toast("Impossible de charger les détails du contrat (signataires/historique)", "error");
    });
    if (!selected.logo_url) {
      void (async () => {
        try {
          const { data } = await supabase.from("contracts").select("logo_url").eq("id", selected.id).single();
          if (data?.logo_url) setSelected(prev => prev ? { ...prev, logo_url: data.logo_url as string } : prev);
        } catch {}
      })();
    }
  }, [selected?.id, userId]);

  const logActivity = useCallback(async (contractId: string, action: string, details = "") => {
    if (!userId) return;
    const { data } = await supabase.from("contract_activities").insert({ contract_id: contractId, user_id: userId, action, details }).select().single();
    if (data) setActivities((prev) => [data as CActivity, ...prev]);
  }, [userId]);

  const loadMoreContracts = useCallback(async () => {
    if (!userId || loadingMore || !hasMoreContracts || contracts.length === 0) return;
    setLoadingMore(true);
    const oldest = contracts[contracts.length - 1].created_at;
    const { data, error } = await supabase
      .from("contracts").select(CONTRACT_SELECT)
      .eq("user_id", userId).order("created_at", { ascending: false })
      .lt("created_at", oldest).limit(51);
    setLoadingMore(false);
    if (error || !data) return;
    const more = data as Contract[];
    if (more.length > 50) { setHasMoreContracts(true); setContracts(prev => [...prev, ...more.slice(0, 50)]); }
    else { setHasMoreContracts(false); setContracts(prev => [...prev, ...more]); }
  }, [userId, contracts, loadingMore, hasMoreContracts]);

  const selectContract = useCallback((c: Contract) => { setSelected(c); }, []);

  const handleContentChange = useCallback((value: string) => {
    setEditContent(value);
    if (!selected) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase.from("contracts").update({ content: value }).eq("id", selected.id);
      setSaving(false);
      if (!error) {
        setContracts((prev) => prev.map((c) => c.id === selected.id ? { ...c, content: value } : c));
        setSelected((prev) => prev ? { ...prev, content: value } : prev);
        if (userId) {
          void (async () => { try { await supabase.from("contract_versions").insert({ user_id: userId, contract_id: selected.id, content: value }); const { data } = await supabase.from("contract_versions").select("created_at,content").eq("contract_id", selected.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(5); if (data) setContractVersions(data.map(r => ({ ts: new Date(r.created_at as string).getTime(), content: r.content as string }))); } catch {} })();
        }
      }
    }, 2000);
  }, [selected]);

  const handleStatusChange = useCallback(async (newStatus: ContractStatus) => {
    if (!selected) return;
    const { error } = await supabase.from("contracts").update({ status: newStatus }).eq("id", selected.id);
    if (!error) {
      setContracts((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: newStatus } : c));
      setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast(`Statut : ${STATUS_CFG[newStatus].label}`, "success");
      await logActivity(selected.id, "status_changed", `→ ${STATUS_CFG[newStatus].label}`);
    }
  }, [selected, toast, logActivity]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Copié !", "success");
  }, [editContent, toast]);

  const handleSaveTemplate = useCallback(async () => {
    if (!selected || !editContent.trim() || !userId) { toast("Contenu vide", "error"); return; }
    const name = window.prompt("Nom du modèle", selected.title) ?? "";
    if (!name.trim()) return;
    const { data, error } = await supabase.from("contract_templates").insert({ user_id: userId, name: name.trim(), type: selected.contract_type, content: editContent }).select().single();
    if (error) { toast("Erreur sauvegarde modèle", "error"); return; }
    setTemplates(prev => [{ id: data.id as string, name: data.name as string, type: data.type as ContractType, content: data.content as string }, ...prev].slice(0, 12));
    toast("Modèle sauvegardé", "success");
  }, [selected, editContent, userId, toast]);

  const handleRestoreVersion = useCallback((v: ContractVersion) => {
    setPrevEditContent(editContent);
    handleContentChange(v.content);
    toast(`Version du ${new Date(v.ts).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} restaurée`, "success");
  }, [editContent, handleContentChange, toast]);

  const handleUndoRestore = useCallback(() => {
    if (prevEditContent === null) return;
    handleContentChange(prevEditContent);
    setPrevEditContent(null);
    toast("Restauration annulée", "success");
  }, [prevEditContent, handleContentChange, toast]);

  const handleCreateFromTemplate = useCallback(async (t: ContractTemplate) => {
    if (!userId) return;
    setTmplModal(false);
    const { data, error } = await supabase.from("contracts").insert({
      user_id: userId, title: t.name, client_name: "", client_email: "",
      client_company: "", contract_type: t.type, content: t.content,
      status: "brouillon", amount: null,
    }).select().single();
    if (error || !data) { toast("Erreur création", "error"); return; }
    const c = data as Contract;
    setContracts((prev) => [c, ...prev]);
    selectContract(c);
    toast("Contrat créé depuis le modèle", "success");
  }, [userId, selectContract, toast]);

  const getPDFData = useCallback(() => {
    if (!selected) return null;
    const cs = companySettings;
    const addr = cs ? [cs.address, cs.postal_code, cs.city].filter(Boolean).join(", ") || undefined : undefined;
    return {
      title: selected.title, client_name: selected.client_name,
      type: selected.contract_type, content: editContent,
      amount: selected.amount, start_date: selected.start_date,
      end_date: selected.end_date, created_at: selected.created_at,
      prestataire_nom:        cs?.name   || userName,
      prestataire_email:      cs?.email  || userEmail,
      prestataire_entreprise: cs?.name   || undefined,
      prestataire_adresse:    addr,
      prestataire_siret:      cs?.siret  || undefined,
      company_logo: selected.logo_url || undefined,
    };
  }, [selected, editContent, userName, userEmail, companySettings]);

  const handleDownloadPDF = useCallback(() => {
    const data = getPDFData();
    if (!data) return;
    if (!data.content.trim()) { toast("Contrat vide — ajoutez du contenu d'abord", "error"); return; }
    try { downloadContractPDF(data); toast("PDF téléchargé", "success"); }
    catch (e) { console.error(e); toast("Erreur PDF", "error"); }
  }, [getPDFData, toast]);

  const handleViewPDF = useCallback(() => {
    const data = getPDFData();
    if (!data) return;
    if (!data.content.trim()) { toast("Contrat vide", "error"); return; }
    try { openContractPDF(data); }
    catch (e) { console.error(e); toast("Erreur PDF", "error"); }
  }, [getPDFData, toast]);

  const handleSendToClient = useCallback(() => {
    if (!selected) return;
    const subject = encodeURIComponent(`Contrat : ${selected.title}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver en pièce jointe le contrat « ${selected.title} ».\n\nCordialement`);
    window.open(`mailto:${selected.client_email ?? ""}?subject=${subject}&body=${body}`, "_blank");
    toast("Téléchargez le PDF puis joignez-le à votre email", "info");
  }, [selected, toast]);

  const handleToFacture = useCallback(() => {
    if (!selected) return;
    const params = new URLSearchParams({ from: "contrat", title: selected.title, client: selected.client_name, ...(selected.amount != null ? { amount: String(selected.amount) } : {}) });
    window.location.href = `/client/factures?${params}`;
  }, [selected]);

  const handleDuplicate = useCallback(async () => {
    if (!selected || !userId) return;
    const { data, error } = await supabase.from("contracts").insert({
      user_id: userId, title: `${selected.title} (copie)`,
      client_name: selected.client_name, client_email: selected.client_email,
      client_company: selected.client_company, contract_type: selected.contract_type,
      content: selected.content, status: "brouillon", amount: selected.amount,
      currency: selected.currency, duration_months: selected.duration_months,
      start_date: selected.start_date, end_date: selected.end_date,
      jurisdiction: selected.jurisdiction, language: selected.language,
      specific_clauses: selected.specific_clauses,
    }).select().single();
    if (error || !data) { toast("Erreur duplication", "error"); return; }
    const dup = data as Contract;
    setContracts((prev) => [dup, ...prev]);
    selectContract(dup);
    toast("Contrat dupliqué", "success");
    await logActivity(dup.id, "created", `Dupliqué depuis « ${selected.title} »`);
  }, [selected, userId, toast, selectContract, logActivity]);

  const handleCreateContract = useCallback(async (form: DraftForm, generatedContent = "") => {
    if (!form.title || !form.client_name) { toast("Titre et client requis", "error"); return; }
    if (!userId) return;
    setCreating(true);
    try {
      const payload = {
        user_id: userId, title: form.title, client_name: form.client_name,
        client_email: form.client_email, client_company: form.client_company,
        contract_type: form.type, content: generatedContent, status: "brouillon",
        amount: form.amount ? parseFloat(form.amount) : null,
        currency: form.currency, duration_months: parseInt(form.duration_months) || 12,
        start_date: form.start_date || null, end_date: form.end_date || null,
        jurisdiction: form.jurisdiction, language: form.language,
        specific_clauses: [...form.selected_clauses, form.specifics].filter(Boolean).join("\n"),
        logo_url: form.logo || null,
      };
      const { data, error } = await supabase.from("contracts").insert(payload).select().single();
      if (error) throw new Error(error.message);
      const newC = data as Contract;
      setContracts((prev) => [newC, ...prev]);
      setShowModal(false);
      selectContract(newC);
      toast(generatedContent ? "Contrat généré" : "Brouillon créé", "success");
      await logActivity(newC.id, "created", `Type : ${TYPE_MAP[form.type]}`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erreur création", "error");
    } finally { setCreating(false); }
  }, [userId, toast, selectContract, logActivity]);

  const handleGenerate = useCallback(async (form: DraftForm) => {
    if (!form.title || !form.client_name) { toast("Titre et client requis", "error"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/contrats/generer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, client_name: form.client_name, title: form.title,
          amount: form.amount ? parseFloat(form.amount) : undefined,
          start_date: form.start_date || undefined, end_date: form.end_date || undefined,
          specifics: [...form.selected_clauses, form.specifics].filter(Boolean).join("; ") || undefined,
          prestataire_nom: userName }),
      });
      const json = await res.json() as { content?: string; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Erreur de génération");
      await handleCreateContract(form, json.content ?? "");
    } catch {
      toast("Génération IA indisponible — contrat créé avec le modèle standard.", "error");
      const templateContent = buildContractText(form);
      await handleCreateContract(form, templateContent);
    } finally { setGenerating(false); }
  }, [toast, handleCreateContract, userName]);

  const handleAddSigner = useCallback(async (name: string, email: string, role: string) => {
    if (!selected || !userId) return;
    const { data, error } = await supabase.from("contract_signatures").insert({
      contract_id: selected.id, user_id: userId,
      signer_name: name, signer_email: email, signer_role: role,
      order_index: signers.length, status: "pending",
    }).select().single();
    if (!error && data) {
      setSigners((prev) => [...prev, data as Signer]);
      toast("Signataire ajouté", "success");
      await logActivity(selected.id, "signer_added", `${name} (${role})`);
    }
  }, [selected, userId, signers.length, toast, logActivity]);

  const handleDeleteSigner = useCallback(async (id: string) => {
    const { error } = await supabase.from("contract_signatures").delete().eq("id", id);
    if (error) { toast("Erreur suppression signataire", "error"); return; }
    setSigners((prev) => prev.filter((s) => s.id !== id));
  }, [toast]);

  const handleCounterSign = useCallback(async () => {
    if (!selected || !userId || counterSigning) return;
    const adminName = userName || "Gérant";
    const existing = signers.find(s => s.signer_role === "gérant" && s.signer_name === adminName);
    if (existing) {
      if (existing.status === "signed") { toast("Vous avez déjà signé ce contrat", "info"); return; }
      setSignerToSign(existing);
      return;
    }
    setCounterSigning(true);
    const { data, error } = await supabase.from("contract_signatures").insert({
      contract_id: selected.id, user_id: userId,
      signer_name: adminName, signer_email: "", signer_role: "gérant",
      order_index: 0, status: "pending",
    }).select().single();
    setCounterSigning(false);
    if (error || !data) { toast("Erreur", "error"); return; }
    const newSigner = data as Signer;
    setSigners(prev => [newSigner, ...prev]);
    setSignerToSign(newSigner);
  }, [selected, userId, userName, signers, counterSigning, toast]);

  const handleSignContract = useCallback(async (sigData: string, cert: string) => {
    if (!signerToSign || !selected) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("contract_signatures").update({
      status: "signed", signed_at: now, signature_data: sigData, certificate: cert,
    }).eq("id", signerToSign.id);
    if (!error) {
      setSigners((prev) => prev.map((s) => s.id === signerToSign.id ? { ...s, status: "signed", signed_at: now, signature_data: sigData, certificate: cert } : s));
      toast("Contrat signé", "success");
      await logActivity(selected.id, "signed", `Signé par ${signerToSign.signer_name}`);
      const updatedSigners = signers.map((s) =>
        s.id === signerToSign.id ? { ...s, status: "signed" as const } : s
      );
      const anyRefused = updatedSigners.some((s) => s.status === "refused");
      const allSigned = updatedSigners.every((s) => s.status === "signed");
      if (allSigned && !anyRefused) await handleStatusChange("signé");
    }
    setSignerToSign(null);
  }, [signerToSign, selected, signers, toast, logActivity, handleStatusChange]);

  const handleAddComment = useCallback(async (text: string) => {
    if (!selected || !userId) return;
    const { data, error } = await supabase.from("contract_comments").insert({
      contract_id: selected.id, user_id: userId, author_name: userName || "Vous", content: text,
    }).select().single();
    if (!error && data) {
      setComments((prev) => [data as CComment, ...prev]);
      await logActivity(selected.id, "commented", text.substring(0, 60));
    }
  }, [selected, userId, userName, logActivity]);

  const handleDelete = useCallback((id: string) => { setConfirmDeleteId(id); }, []);
  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("contracts").delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (!error) {
      setContracts((prev) => prev.filter((c) => c.id !== confirmDeleteId));
      if (selected?.id === confirmDeleteId) setSelected(null);
      toast("Contrat supprimé", "info");
    } else { toast("Erreur suppression", "error"); }
  }, [confirmDeleteId, selected, toast]);

  const exportCSV = useCallback(() => {
    const rows = [["Titre", "Client", "Société", "Type", "Statut", "Montant", "Début", "Fin"].join(";"),
      ...contracts.map((c) => [c.title, c.client_name, c.client_company, TYPE_MAP[c.contract_type], STATUS_CFG[c.status].label, c.amount ?? 0, c.start_date ?? "", c.end_date ?? ""].join(";"))];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "contrats.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [contracts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = contracts.filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterType !== "all" && c.contract_type !== filterType) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.client_name.toLowerCase().includes(q)) return false;
      return true;
    });
    return result.sort((a, b) => {
      switch (sortBy) {
        case "amount": return (b.amount ?? 0) - (a.amount ?? 0);
        case "client": return a.client_name.localeCompare(b.client_name, "fr");
        default: return b.created_at.localeCompare(a.created_at);
      }
    });
  }, [contracts, filterStatus, filterType, search, sortBy]);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#07080e] text-white" : "bg-[#f4f5f9] text-gray-900"}`}>
      <ToastStack toasts={toasts} remove={removeToast}/>

      {/* Header */}
      <div className="relative overflow-hidden shrink-0 sticky top-0 z-10" style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#07080e)" : "linear-gradient(160deg,#eef0f8,#e8ebf5,#eef0f8)" }}>
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
        <div className="pointer-events-none absolute -bottom-10 right-16 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }}/>

        <div className="relative px-5 pt-4 pb-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="min-w-0">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Contrats IA</h1>
                <p className={`text-[0.62rem] truncate ${isDark ? "text-white/35" : "text-gray-500"}`}>Génération · Signature · Suivi juridique</p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl border overflow-hidden ${isDark ? "border-white/[0.07]" : "border-gray-200"}`}>
                {(["list", "dashboard"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${view === v ? "text-[#0a0a0a]" : isDark ? "text-white/40 hover:text-white/60" : "text-gray-500 hover:text-gray-700"}`}
                    style={view === v ? { background: gold } : {}}>
                    {v === "list" ? "Liste" : <><span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Stats</span></>}
                  </button>
                ))}
              </div>
              {templates.length > 0 && (
                <button onClick={() => setTmplModal(true)}
                  className={`h-8 flex items-center gap-1.5 px-3 rounded-xl border transition-all text-xs font-medium ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                  title="Mes modèles">
                  <BookMarked size={13}/> {templates.length}
                </button>
              )}
              <button onClick={exportCSV} className={`h-8 flex items-center gap-1.5 px-3 rounded-xl border transition-all ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`} title="Exporter CSV">
                <Download size={13}/>
                <span className="hidden sm:inline text-xs font-semibold">Exporter</span>
              </button>
              <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(201,165,90,0.35)" }}>
                <Plus size={13}/> Nouveau
              </motion.button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative px-5 pb-4 sm:px-8">
          <div className="mx-auto max-w-7xl flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { label: "Total",    value: contracts.length,                                                                                     icon: FileText,    onClick: () => { setView("list"); setFilterStatus("all"); setFilterType("all"); setSearch(""); setSortBy("date"); } },
              { label: "Signés",   value: contracts.filter((c) => c.status === "signé").length,                                                 icon: CheckCircle, onClick: () => { setView("list"); setFilterStatus("signé"); setFilterType("all"); setSearch(""); } },
              { label: "En cours", value: contracts.filter((c) => ["actif","validation","envoyé","vu"].includes(c.status)).length,               icon: Clock,       onClick: () => { setView("list"); setFilterStatus("actif"); setFilterType("all"); setSearch(""); } },
              { label: "Valeur",   value: contracts.reduce((s, c) => s + (c.amount ?? 0), 0) > 0 ? fmtEur(contracts.reduce((s, c) => s + (c.amount ?? 0), 0)) : "—", icon: DollarSign, onClick: () => { setView("list"); setSortBy("amount"); setFilterStatus("all"); setFilterType("all"); setSearch(""); } },
            ].map((kpi, i) => {
              const KpiIcon = kpi.icon;
              return (
                <motion.button key={kpi.label} onClick={kpi.onClick} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border cursor-pointer transition-all text-left ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white/60"}`}>
                  <KpiIcon size={13} style={{ color: gold }} className="shrink-0"/>
                  <div>
                    <p className={`text-sm font-bold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>{kpi.value}</p>
                    <p className={`text-[0.58rem] uppercase tracking-wide mt-0.5 whitespace-nowrap ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.45),transparent)" }}/>
      </div>

      {/* Body */}
      {view === "dashboard" ? (
        <DashboardView contracts={contracts} onNew={() => setShowModal(true)} onSelect={(c) => { setView("list"); selectContract(c); }} isDark={isDark}/>
      ) : (
        <div className="flex h-[calc(100vh-140px)]">
          {/* Left: list */}
          <div className={`flex flex-col overflow-hidden ${isDark ? "border-r border-white/[0.06]" : "border-r border-gray-200"} ${selected ? "hidden md:flex md:w-[340px] lg:w-[380px]" : "flex w-full md:w-[340px] lg:w-[380px]"}`}>
            {/* Filters */}
            <div className={`p-3 space-y-2 ${isDark ? "border-b border-white/[0.06]" : "border-b border-gray-200"}`}>
              <div className="relative">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition-colors pl-8 ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/[0.18]" : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300"}`}/>
                <Eye size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
              </div>
              <div className="flex gap-2">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ContractStatus | "all")}
                  className="flex-1 rounded-xl border px-2 py-1.5 text-xs focus:outline-none appearance-none"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: isDark ? "rgba(255,255,255,0.7)" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
                  <option value="all">Tous statuts</option>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as ContractType | "all")}
                  className="flex-1 rounded-xl border px-2 py-1.5 text-xs focus:outline-none appearance-none"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: isDark ? "rgba(255,255,255,0.7)" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
                  <option value="all">Tous types</option>
                  {CONTRACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "client")}
                className="w-full rounded-xl border px-2 py-1.5 text-xs focus:outline-none appearance-none"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: isDark ? "rgba(255,255,255,0.7)" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
                <option value="date">Plus récent</option>
                <option value="amount">Montant ↓</option>
                <option value="client">Client A→Z</option>
              </select>
            </div>

            {/* Contract list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-32"><RefreshCw size={20} className={`animate-spin ${isDark ? "text-white/30" : "text-gray-400"}`}/></div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
                    <FileText size={28} style={{ color: gold }}/>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-gray-700"}`}>Aucun contrat</p>
                    <p className={`text-xs mt-1.5 max-w-[200px] leading-relaxed ${isDark ? "text-white/35" : "text-gray-400"}`}>Créez votre premier contrat et laissez l&apos;IA le rédiger en quelques secondes.</p>
                  </div>
                  <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                    <Sparkles size={13}/> Générer un contrat
                  </button>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {filtered.map((c) => (
                      <ContractCard key={c.id} contract={c} isSelected={selected?.id === c.id}
                        onSelect={() => selectContract(c)} onDelete={handleDelete} isDark={isDark}/>
                    ))}
                  </AnimatePresence>
                  {hasMoreContracts && !search && filterStatus === "all" && filterType === "all" && (
                    <button onClick={loadMoreContracts} disabled={loadingMore}
                      className="w-full mt-1 py-2 rounded-xl text-xs text-white/40 border border-white/[0.06] hover:bg-white/[0.04] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                      {loadingMore ? <RefreshCw size={12} className="animate-spin"/> : null}
                      {loadingMore ? "Chargement…" : "Charger 50 de plus"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: detail */}
          <AnimatePresence>
            {selected ? (
              <DetailPanel
                contract={selected} signers={signers} activities={activities} comments={comments}
                editContent={editContent} saving={saving} onContentChange={handleContentChange}
                onStatusChange={handleStatusChange} onDownloadPDF={handleDownloadPDF}
                onViewPDF={handleViewPDF} onSendToClient={handleSendToClient} onToFacture={handleToFacture}
                onCopy={handleCopy} copied={copied} userId={userId} userName={userName}
                onAddSigner={handleAddSigner} onDeleteSigner={handleDeleteSigner}
                onSignContract={(signer) => setSignerToSign(signer)}
                onCounterSign={handleCounterSign} counterSigning={counterSigning}
                onAddComment={handleAddComment} onShowAI={() => setShowAIModal(true)}
                onDuplicate={handleDuplicate} onClose={() => setSelected(null)}
                versions={contractVersions} prevContent={prevEditContent}
                onRestoreVersion={handleRestoreVersion} onUndoRestore={handleUndoRestore}
                onSaveTemplate={handleSaveTemplate}
              />
            ) : (
              contracts.length > 0 && (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 35% at 50% 50%, ${gold}05 0%, transparent 70%)` }}/>
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl" style={{ background: gold + "0f", border: `1px solid ${gold}20` }}>
                    <Edit2 size={18} style={{ color: gold + "80" }}/>
                  </div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white/25" : "text-gray-400"}`}>Sélectionnez un contrat</p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <CreateModal onClose={() => setShowModal(false)}
            onGenerate={handleGenerate} onCreateBlank={(f) => handleCreateContract(f)}
            generating={generating} creating={creating}/>
        )}
        {signerToSign && selected && (
          <SignModal signer={signerToSign} contractTitle={selected.title}
            onClose={() => setSignerToSign(null)}
            onSign={(sigData, cert) => handleSignContract(sigData, cert)}/>
        )}
        {showAIModal && selected && (
          <AIModal contract={selected} onClose={() => setShowAIModal(false)}/>
        )}
      </AnimatePresence>

      {/* Templates modal */}
      <AnimatePresence>
        {tmplModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setTmplModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{ background: "#0d1117" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <BookMarked size={15} style={{ color: gold }}/>
                  <h3 className="text-sm font-bold text-white">Mes modèles</h3>
                </div>
                <button onClick={() => setTmplModal(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70">
                  <X size={14}/>
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {templates.length === 0 ? (
                  <p className="text-center py-6 text-white/30 text-xs">Aucun modèle sauvegardé</p>
                ) : templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 truncate">{t.name}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">{TYPE_MAP[t.type]}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleCreateFromTemplate(t)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                        style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                        <Plus size={9}/> Utiliser
                      </motion.button>
                      <button onClick={async () => { await supabase.from("contract_templates").delete().eq("id", t.id); setTemplates(prev => prev.filter(x => x.id !== t.id)); }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/25 hover:text-red-400 transition-all">
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal open={confirmDeleteId !== null} title="Supprimer ce contrat ?"
        description="Le contrat et toutes ses données seront définitivement supprimés."
        confirmLabel="Supprimer" loading={deleting}
        onConfirm={confirmDelete} onCancel={() => setConfirmDeleteId(null)}/>
    </div>
  );
}

