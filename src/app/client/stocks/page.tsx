"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, AlertOctagon, TrendingUp, Download,
  Activity, DollarSign, RefreshCw, BarChart2, Truck, Users, ClipboardList,
  ShoppingCart, Bell,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fmtEur } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import { useOrganization } from "@/lib/use-organization";

import type { Product, Movement, Supplier, Warehouse, SupplierOrder, LoyalClient, ClientDelivery, FournisseurImport } from "./types";
import { gold, EMPTY_PRODUCT, EMPTY_SUPPLIER, EMPTY_CLIENT, EMPTY_DELIVERY, PRODUCT_LIST_COLS } from "./constants";
import { DarkCtx } from "./ui";
import { DashboardView }  from "./DashboardView";
import { ProductsView }   from "./ProductsView";
import { MovementsView }  from "./MovementsView";
import { SuppliersView }  from "./SuppliersView";
import { ReportView }     from "./ReportView";
import { ClientsView }    from "./ClientsView";
import { InventoryView }  from "./InventoryView";
import { VentesView }     from "./VentesView";
import { AlertesView }    from "./AlertesView";
import { LotsView }       from "./LotsView";
import { ProductModal }   from "./ProductModal";
import { MovementModal }  from "./MovementModal";
import { SupplierModal }  from "./SupplierModal";
import { ClientModal, DeliveryModal } from "./ClientModal";

export default function StocksPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const { isDark } = useTheme();
  const router = useRouter();

  const orgState = useOrganization();
  const orgId = orgState.status === "ready" ? orgState.org.id : null;

  const [userId, setUserId]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "products" | "movements" | "suppliers" | "report" | "clients" | "inventaire" | "ventes" | "alertes">("dashboard");
  const [lotsProduct, setLotsProduct] = useState<Product | null>(null);

  const [products,          setProducts]          = useState<Product[]>([]);
  const [movements,         setMovements]         = useState<Movement[]>([]);
  const [suppliers,         setSuppliers]         = useState<Supplier[]>([]);
  const [warehouses,        setWarehouses]        = useState<Warehouse[]>([]);
  const [orders,            setOrders]            = useState<SupplierOrder[]>([]);
  const [clients,           setClients]           = useState<LoyalClient[]>([]);
  const [deliveries,        setDeliveries]        = useState<ClientDelivery[]>([]);
  const [fournisseursImport,setFournisseursImport]= useState<FournisseurImport[]>([]);

  const [showClientModal,       setShowClientModal]       = useState(false);
  const [editClientForm,        setEditClientForm]        = useState<Partial<LoyalClient>>(EMPTY_CLIENT());
  const [showDeliveryModal,     setShowDeliveryModal]     = useState(false);
  const [deliveryPresetClient,  setDeliveryPresetClient]  = useState<LoyalClient | null>(null);

  const [showProductModal,  setShowProductModal]  = useState(false);
  const [editProduct,       setEditProduct]       = useState<Partial<Product>>(EMPTY_PRODUCT());
  const [showMovModal,      setShowMovModal]      = useState(false);
  const [movProductPreset,  setMovProductPreset]  = useState<Product | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editSupplier,      setEditSupplier]      = useState<Partial<Supplier>>(EMPTY_SUPPLIER());
  const [confirmDeleteId,   setConfirmDeleteId]   = useState<string | null>(null);
  const [deleteType,        setDeleteType]        = useState<"product" | "supplier">("product");
  const [deleting,          setDeleting]          = useState(false);

  // Load all data
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
        setUserId(user.id);

        const [prodRes, movRes, supRes, whRes, ordRes, cliRes, delRes, fournRes] = await Promise.all([
          // Performance: exclude image_url from bulk query (base64 JPEG, loaded only on edit)
          supabase.from("stock_products").select(PRODUCT_LIST_COLS).eq("user_id", user.id).order("name"),
          supabase.from("stock_movements").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
          supabase.from("stock_suppliers").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_warehouses").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_supplier_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("stock_loyal_clients").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_client_deliveries").select("*").eq("user_id", user.id).order("delivery_date", { ascending: false }).limit(500),
          supabase.from("fournisseurs").select("id,company_name,contact_name,email,phone,payment_terms").eq("user_id", user.id).eq("is_active", true).order("company_name").limit(200),
        ]);

        if (!prodRes.error && prodRes.data) setProducts(prodRes.data as unknown as Product[]);
        if (!movRes.error  && movRes.data)  setMovements(movRes.data as Movement[]);
        const loadedSuppliers = (!supRes.error && supRes.data) ? supRes.data as Supplier[] : [];
        setSuppliers(loadedSuppliers);
        if (!whRes.error  && whRes.data)  setWarehouses(whRes.data as Warehouse[]);
        if (!ordRes.error && ordRes.data) setOrders(ordRes.data as SupplierOrder[]);
        if (!cliRes.error && cliRes.data) setClients(cliRes.data as LoyalClient[]);
        if (!delRes.error && delRes.data) setDeliveries(delRes.data as ClientDelivery[]);
        if (!fournRes.error && fournRes.data) {
          const linkedIds = new Set(loadedSuppliers.map(s => s.fournisseur_id).filter(Boolean));
          setFournisseursImport((fournRes.data as FournisseurImport[]).filter(f => !linkedIds.has(f.id)));
        }
      } catch {
        toast("Erreur réseau — impossible de charger les stocks", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProduct = useCallback(async (form: Partial<Product>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("stock_products").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setProducts(prev => prev.map(p => p.id === form.id ? data as Product : p));
      toast("Produit mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("stock_products").insert({ ...form, user_id: userId, organization_id: orgId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setProducts(prev => [data as Product, ...prev]);
      toast("Produit créé", "success");
    }
    setShowProductModal(false);
    setEditProduct(EMPTY_PRODUCT());
  }, [userId, orgId, toast]);

  const handleSaveMovement = useCallback(async (form: Partial<Movement>) => {
    if (!userId || !form.product_id || !form.quantity) return;
    const product = products.find(p => p.id === form.product_id);
    if (!product) return;

    // Ajustement : la quantité saisie EST le stock cible (pas un delta)
    if (form.type === "ajustement") {
      const before = product.stock_current;
      const after  = form.quantity;
      const delta  = Math.abs(after - before);
      if (delta === 0) { toast("Stock déjà à ce niveau", "info"); setShowMovModal(false); return; }
      const movPayload = { ...form, user_id: userId, product_name: product.name, before_qty: before, after_qty: after, quantity: delta };
      const { data: movData, error: movErr } = await supabase.from("stock_movements").insert(movPayload).select().single();
      if (movErr) { toast(movErr.message, "error"); return; }
      const { data: prodData, error: prodErr } = await supabase.from("stock_products")
        .update({ stock_current: after, updated_at: new Date().toISOString() }).eq("id", product.id).select().single();
      if (prodErr) { toast(prodErr.message, "error"); return; }
      setMovements(prev => [movData as Movement, ...prev]);
      setProducts(prev => prev.map(p => p.id === product.id ? prodData as Product : p));
      toast("Ajustement enregistré", "success");
      setShowMovModal(false);
      setMovProductPreset(null);
      return;
    }

    // Tous les autres types : appel RPC atomique
    const { data: movId, error } = await supabase.rpc("atomic_stock_movement", {
      p_product_id:      form.product_id,
      p_type:            form.type ?? "entree",
      p_quantity:        form.quantity,
      p_reason:          form.reason         ?? "",
      p_reference:       form.reference      ?? "",
      p_unit_cost:       form.unit_cost       ?? 0,
      p_warehouse_id:    form.warehouse_id    ?? null,
      p_to_warehouse_id: form.to_warehouse_id ?? null,
    });
    if (error) { toast(error.message, "error"); return; }

    const [movRes, prodRes] = await Promise.all([
      supabase.from("stock_movements").select("*").eq("id", movId as string).single(),
      supabase.from("stock_products").select("*").eq("id", form.product_id).single(),
    ]);
    if (movRes.data)  setMovements(prev => [movRes.data as Movement, ...prev]);
    if (prodRes.data) setProducts(prev => prev.map(p => p.id === form.product_id ? prodRes.data as Product : p));

    toast("Mouvement enregistré", "success");
    setShowMovModal(false);
    setMovProductPreset(null);
  }, [userId, products, toast]);

  const handleSaveSupplier = useCallback(async (form: Partial<Supplier>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("stock_suppliers").update(form).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setSuppliers(prev => prev.map(s => s.id === form.id ? data as Supplier : s));
      toast("Fournisseur mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("stock_suppliers").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setSuppliers(prev => [data as Supplier, ...prev]);
      toast("Fournisseur créé", "success");
    }
    setShowSupplierModal(false);
    setEditSupplier(EMPTY_SUPPLIER());
  }, [userId, toast]);

  const handleImportFournisseur = useCallback(async (fournisseurId: string) => {
    const { data: supId, error } = await supabase.rpc("import_fournisseur_as_stock_supplier", {
      p_fournisseur_id: fournisseurId,
    });
    if (error) { toast(error.message, "error"); return; }
    const { data: newSup } = await supabase.from("stock_suppliers").select("*").eq("id", supId as string).single();
    if (newSup) setSuppliers(prev => [...prev, newSup as Supplier]);
    setFournisseursImport(prev => prev.filter(f => f.id !== fournisseurId));
    toast("Fournisseur importé dans le module Stocks", "success");
  }, [toast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const table = deleteType === "product" ? "stock_products" : "stock_suppliers";
    const { error } = await supabase.from(table).delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (error) {
      if (error.code === "23503") {
        toast("Ce fournisseur est lié à des produits. Réaffectez-les d'abord.", "error");
      } else {
        toast(error.message, "error");
      }
      return;
    }
    if (deleteType === "product") setProducts(prev => prev.filter(p => p.id !== confirmDeleteId));
    else setSuppliers(prev => prev.filter(s => s.id !== confirmDeleteId));
    toast("Supprimé", "info");
  }, [confirmDeleteId, deleteType, toast]);

  const handleSaveClient = useCallback(async (form: Partial<LoyalClient>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("stock_loyal_clients").update(form).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setClients(p => p.map(c => c.id === form.id ? data as LoyalClient : c));
      toast("Client mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("stock_loyal_clients").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setClients(p => [data as LoyalClient, ...p]);
      toast("Client ajouté", "success");
    }
    setShowClientModal(false);
    setEditClientForm(EMPTY_CLIENT());
  }, [userId, toast]);

  const handleDeleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("stock_loyal_clients").delete().eq("id", id);
    if (error) { toast(error.message, "error"); return; }
    setClients(p => p.filter(c => c.id !== id));
    toast("Client supprimé", "info");
  }, [toast]);

  const handleSaveDelivery = useCallback(async (form: Partial<ClientDelivery>) => {
    if (!userId || !form.client_id || !form.product_id || !form.quantity) return;

    const { data: movId, error: movErr } = await supabase.rpc("atomic_stock_movement", {
      p_product_id:      form.product_id,
      p_type:            "sortie",
      p_quantity:        form.quantity,
      p_reason:          `Livraison ${form.client_name ?? "client"}`,
      p_reference:       "",
      p_unit_cost:       0,
      p_warehouse_id:    null,
      p_to_warehouse_id: null,
    });
    if (movErr) {
      toast(movErr.message.includes("insuffisant") ? "Stock insuffisant pour cette livraison" : movErr.message, "error");
      return;
    }

    const { data, error } = await supabase.from("stock_client_deliveries")
      .insert({ ...form, user_id: userId }).select().single();
    if (error) { toast(error.message, "error"); return; }

    const [movRes, prodRes] = await Promise.all([
      supabase.from("stock_movements").select("*").eq("id", movId as string).single(),
      supabase.from("stock_products").select("*").eq("id", form.product_id).single(),
    ]);
    if (movRes.data)  setMovements(prev => [movRes.data as Movement, ...prev]);
    if (prodRes.data) setProducts(prev => prev.map(p => p.id === form.product_id ? prodRes.data as Product : p));

    setDeliveries(p => [data as ClientDelivery, ...p]);
    toast("Livraison enregistrée · Stock mis à jour", "success");
    setShowDeliveryModal(false);
    setDeliveryPresetClient(null);
  }, [userId, toast]);

  const exportCSV = useCallback(() => {
    if (tab === "movements") {
      const rows = [
        ["Date","Référence","Produit","Type","Quantité","Avant","Après","Motif"].join(";"),
        ...movements.map(m => [m.date, m.reference, m.product_name, m.type, m.quantity, m.before_qty, m.after_qty, m.reason].join(";")),
      ];
      const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url; a.download = "mouvements.csv"; a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = [
        ["Nom","SKU","Catégorie","Stock actuel","Stock min","Prix achat","Prix vente","Fournisseur"].join(";"),
        ...products.map(p => [p.name, p.sku, p.category, p.stock_current, p.stock_minimum, p.purchase_price, p.sale_price, p.supplier_name].join(";")),
      ];
      const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url; a.download = "stocks.csv"; a.click();
      URL.revokeObjectURL(url);
    }
  }, [products, movements, tab]);

  const TABS = [
    { key: "dashboard",  label: "Dashboard",   icon: BarChart2 },
    { key: "products",   label: "Produits",     icon: Package },
    { key: "movements",  label: "Mouvements",   icon: Activity },
    { key: "suppliers",  label: "Fournisseurs", icon: Truck },
    { key: "clients",    label: "Clients",      icon: Users },
    { key: "inventaire", label: "Inventaire",   icon: ClipboardList },
    { key: "ventes",     label: "Ventes",       icon: ShoppingCart },
    { key: "alertes",    label: "Alertes",      icon: Bell },
    { key: "report",     label: "Rapport",      icon: TrendingUp },
  ] as const;

  return (
    <DarkCtx.Provider value={isDark}>
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>
      <ToastStack toasts={toasts} remove={removeToast}/>

      {/* Header */}
      <div className="relative overflow-hidden shrink-0 sticky top-0 z-10" style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#07080e)" : "linear-gradient(160deg,#ffffff,#f8fafc,#ffffff)", borderBottom: isDark ? undefined : "1px solid #e5e7eb" }}>
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
        <div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#10b981,transparent)" }}/>

        <div className="relative px-5 pt-4 pb-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
                <ModuleHeaderIcon icon={Package} color="#0d9488"/>
              </motion.div>
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }} className="min-w-0">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Stocks & Inventaire</h1>
                <p className={`text-[0.62rem] truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>Gestion · Mouvements · Alertes · Fournisseurs</p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} title="Exporter CSV" className={`h-8 flex items-center gap-1.5 px-3 rounded-xl border transition-all ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                <Download size={13}/>
                <span className="hidden sm:inline text-xs font-semibold">Exporter</span>
              </button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }}
                className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-4 py-2 text-xs font-bold transition-all"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(201,165,90,0.35)" }}>
                <Plus size={13}/><span className="hidden sm:inline"> Nouveau produit</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative px-5 pb-3 sm:px-8">
          <div className="mx-auto max-w-7xl flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { label: "Produits", value: products.length,                                                              icon: Package,      tab: "products"  as const },
              { label: "Ruptures", value: products.filter(p => p.stock_current <= 0).length,                           icon: AlertOctagon, tab: "products"  as const },
              { label: "Valeur",   value: fmtEur(products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0)), icon: DollarSign,   tab: "report"    as const },
              { label: "Mvts",     value: movements.length,                                                             icon: Activity,     tab: "movements" as const },
            ].map((kpi, i) => {
              const KpiIcon = kpi.icon;
              return (
                <motion.button key={kpi.label} onClick={() => setTab(kpi.tab)}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border transition-all ${isDark ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                  <KpiIcon size={13} style={{ color: gold }} className="shrink-0"/>
                  <div>
                    <p className={`text-sm font-bold leading-none ${isDark ? "text-white" : "text-gray-800"}`}>{kpi.value}</p>
                    <p className={`text-[0.58rem] uppercase tracking-wide mt-0.5 whitespace-nowrap ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="relative px-5 sm:px-8 flex gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`shrink-0 relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${tab === key ? isDark ? "text-white" : "text-gray-800" : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
              <Icon size={12}/> {label}
              {tab === key && (
                <motion.div layoutId="stocks-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: gold }}/>
              )}
            </button>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={22} className={`animate-spin ${isDark ? "text-white/30" : "text-gray-300"}`}/>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "dashboard" && (
            <DashboardView products={products} movements={movements}
              onNewProduct={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }}
              onNewMovement={() => setShowMovModal(true)}/>
          )}
          {tab === "products" && (
            <ProductsView products={products}
              onNew={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }}
              onEdit={async (p) => {
                // Fetch image_url separately — excluded from bulk query for performance
                const { data } = await supabase.from("stock_products").select("image_url").eq("id", p.id).single();
                setEditProduct({ ...p, image_url: data?.image_url ?? "" });
                setShowProductModal(true);
              }}
              onDelete={(id) => { setDeleteType("product"); setConfirmDeleteId(id); }}
              onAddMovement={(p) => { setMovProductPreset(p); setShowMovModal(true); }}
              onOpenLots={(p) => setLotsProduct(p)}
              onOpenDetail={(p) => router.push(`/client/stocks/${p.id}`)}/>
          )}
          {tab === "movements" && (
            <MovementsView movements={movements} products={products} warehouses={warehouses}
              onNew={() => setShowMovModal(true)}/>
          )}
          {tab === "suppliers" && (
            <SuppliersView suppliers={suppliers} products={products} orders={orders}
              fournisseursImport={fournisseursImport}
              onNew={() => { setEditSupplier(EMPTY_SUPPLIER()); setShowSupplierModal(true); }}
              onEdit={(s) => { setEditSupplier(s); setShowSupplierModal(true); }}
              onDelete={(id) => { setDeleteType("supplier"); setConfirmDeleteId(id); }}
              onImport={handleImportFournisseur}/>
          )}
          {tab === "clients" && (
            <ClientsView clients={clients} deliveries={deliveries} products={products}
              onNewClient={() => { setEditClientForm(EMPTY_CLIENT()); setShowClientModal(true); }}
              onEditClient={(c) => { setEditClientForm(c); setShowClientModal(true); }}
              onDeleteClient={handleDeleteClient}
              onNewDelivery={(c) => { setDeliveryPresetClient(c ?? null); setShowDeliveryModal(true); }}/>
          )}
          {tab === "inventaire" && userId && (
            <InventoryView
              products={products}
              warehouses={warehouses}
              userId={userId}
              onSessionValidated={async () => {
                const { data } = await supabase.from("stock_products").select(PRODUCT_LIST_COLS).eq("user_id", userId).order("name");
                if (data) setProducts(data as unknown as Product[]);
              }}/>
          )}
          {tab === "ventes" && userId && (
            <VentesView products={products} userId={userId}
              onStockChanged={async () => {
                const { data } = await supabase.from("stock_products").select(PRODUCT_LIST_COLS).eq("user_id", userId).order("name");
                if (data) setProducts(data as unknown as Product[]);
              }}/>
          )}
          {tab === "alertes" && userId && (
            <AlertesView products={products} userId={userId}/>
          )}
          {tab === "report" && (
            <ReportView products={products} movements={movements}/>
          )}
        </div>
      )}

      {/* Lots modal */}
      <AnimatePresence>
        {lotsProduct && userId && (
          <LotsView product={lotsProduct} userId={userId} onClose={() => setLotsProduct(null)}/>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showProductModal && (
          <ProductModal product={editProduct} suppliers={suppliers} warehouses={warehouses}
            onSave={handleSaveProduct}
            onClose={() => { setShowProductModal(false); setEditProduct(EMPTY_PRODUCT()); }}/>
        )}
        {showMovModal && (
          <MovementModal
            products={movProductPreset ? [movProductPreset, ...products.filter(p => p.id !== movProductPreset.id)] : products}
            warehouses={warehouses}
            onSave={handleSaveMovement}
            onClose={() => { setShowMovModal(false); setMovProductPreset(null); }}/>
        )}
        {showSupplierModal && (
          <SupplierModal supplier={editSupplier} onSave={handleSaveSupplier}
            onClose={() => { setShowSupplierModal(false); setEditSupplier(EMPTY_SUPPLIER()); }}/>
        )}
        {showClientModal && (
          <ClientModal client={editClientForm} onSave={handleSaveClient}
            onClose={() => { setShowClientModal(false); setEditClientForm(EMPTY_CLIENT()); }}/>
        )}
        {showDeliveryModal && (
          <DeliveryModal
            delivery={deliveryPresetClient
              ? { ...EMPTY_DELIVERY(), client_id: deliveryPresetClient.id, client_name: deliveryPresetClient.name }
              : EMPTY_DELIVERY()}
            clients={clients} products={products}
            onSave={handleSaveDelivery}
            onClose={() => { setShowDeliveryModal(false); setDeliveryPresetClient(null); }}/>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title={`Supprimer ce ${deleteType === "product" ? "produit" : "fournisseur"} ?`}
        description={deleteType === "product" ? "Le produit et tous ses mouvements seront supprimés." : "Le fournisseur sera supprimé."}
        confirmLabel="Supprimer" loading={deleting}
        onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDeleteId(null)}/>
    </div>
    </DarkCtx.Provider>
  );
}
