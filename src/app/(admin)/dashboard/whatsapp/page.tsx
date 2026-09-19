'use client';

import { useState } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  message: string;
  variables: string[];
}

interface ActivityLog {
  id: string;
  time: string;
  client: string;
  phone: string;
  orderId: number;
  templateUsed: string;
  status: 'Sent' | 'Failed';
  failureReason?: string;
}

interface BotSettings {
  botEnabled: boolean;
  notifyOnConfirmation: boolean;
  notifyOnShipping: boolean;
  notifyOnDelivery: boolean;
  delayMinutes: number;
}

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    description: 'Envoyé immédiatement après la confirmation ou la validation de la commande.',
    triggerEvent: 'Statut : Confirmé',
    variables: ['{{client_name}}', '{{order_id}}', '{{total}}', '{{wilaya}}'],
    message:
      'Salam {{client_name}} ! 🌿 Votre commande #{{order_id}} chez Oulla Collection a bien été confirmée. Montant total : {{total}} DZD avec livraison vers {{wilaya}}. Nous préparons votre colis avec soin. Merci pour votre confiance !',
  },
  {
    id: 'shipping_update',
    name: 'Shipping Update',
    description: 'Notifie la cliente dès que son colis est remis au transporteur express.',
    triggerEvent: 'Statut : Expédié',
    variables: ['{{client_name}}', '{{order_id}}', '{{tracking_id}}', '{{wilaya}}'],
    message:
      'Salam {{client_name}} ✨ Bonne nouvelle ! Votre commande #{{order_id}} est en route vers {{wilaya}}. Numéro de suivi transporteur : {{tracking_id}}. Notre livreur vous contactera par téléphone avant la livraison.',
  },
  {
    id: 'order_delivered',
    name: 'Order Delivered',
    description: 'Message de remerciement et demande d’avis après la remise en mains propres.',
    triggerEvent: 'Statut : Livré',
    variables: ['{{client_name}}', '{{order_id}}'],
    message:
      'Salam {{client_name}} 🌸 Votre commande #{{order_id}} a été livrée ! Nous espérons que vos pièces Oulla Collection vous plairont. N’hésitez pas à nous taguer sur Instagram @oulla.collection. À très bientôt !',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    time: 'Il y a 12 min',
    client: 'Amina Benali',
    phone: '0550 12 34 56',
    orderId: 1024,
    templateUsed: 'Order Confirmation',
    status: 'Sent',
  },
  {
    id: 'log-2',
    time: 'Il y a 45 min',
    client: 'Meriem Khelifi',
    phone: '0661 23 45 67',
    orderId: 1023,
    templateUsed: 'Shipping Update',
    status: 'Sent',
  },
  {
    id: 'log-3',
    time: 'Il y a 1 heure',
    client: 'Yasmine Bouzid',
    phone: '0770 34 56 78',
    orderId: 1022,
    templateUsed: 'Order Delivered',
    status: 'Sent',
  },
  {
    id: 'log-4',
    time: 'Il y a 2 heures',
    client: 'Fatima Zohra Mansouri',
    phone: '0560 45 67 89',
    orderId: 1021,
    templateUsed: 'Order Confirmation',
    status: 'Sent',
  },
  {
    id: 'log-5',
    time: 'Il y a 3 heures',
    client: 'Khadidja Saidi',
    phone: '0791 56 78 90',
    orderId: 1020,
    templateUsed: 'Shipping Update',
    status: 'Failed',
    failureReason: 'Numéro WhatsApp non valide ou hors réseau',
  },
  {
    id: 'log-6',
    time: 'Il y a 4 heures',
    client: 'Rania Touati',
    phone: '0555 67 89 01',
    orderId: 1019,
    templateUsed: 'Order Confirmation',
    status: 'Sent',
  },
  {
    id: 'log-7',
    time: 'Il y a 6 heures',
    client: 'Sarah Meziane',
    phone: '0672 78 90 12',
    orderId: 1018,
    templateUsed: 'Order Delivered',
    status: 'Sent',
  },
  {
    id: 'log-8',
    time: 'Il y a 8 heures',
    client: 'Nour El Houda Belkacem',
    phone: '0740 90 12 34',
    orderId: 1017,
    templateUsed: 'Shipping Update',
    status: 'Sent',
  },
];

export default function WhatsAppDashboardPage() {
  // ── Template State ──────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isNewTemplateModal, setIsNewTemplateModal] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    triggerEvent: 'Statut : Personnalisé',
    message: '',
  });

  // ── Settings State ──────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<BotSettings>({
    botEnabled: true,
    notifyOnConfirmation: true,
    notifyOnShipping: true,
    notifyOnDelivery: false,
    delayMinutes: 5,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ── Toast Notification ──────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleOpenEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      description: template.description,
      triggerEvent: template.triggerEvent,
      message: template.message,
    });
    setIsNewTemplateModal(false);
  };

  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      description: 'Modèle envoyé automatiquement selon vos règles personnalisées.',
      triggerEvent: 'Statut : Personnalisé',
      message: 'Salam {{client_name}}, votre commande #{{order_id}} pour un montant de {{total}} DZD est bien enregistrée.',
    });
    setIsNewTemplateModal(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormData.name.trim() || !templateFormData.message.trim()) {
      return;
    }

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: templateFormData.name,
                description: templateFormData.description,
                message: templateFormData.message,
              }
            : t
        )
      );
      showToast(`Modèle « ${templateFormData.name} » mis à jour avec succès !`);
    } else {
      const newTmpl: MessageTemplate = {
        id: `template_${Date.now()}`,
        name: templateFormData.name,
        description: templateFormData.description || 'Modèle de notification personnalisé.',
        triggerEvent: templateFormData.triggerEvent || 'Statut : Personnalisé',
        variables: ['{{client_name}}', '{{order_id}}', '{{total}}'],
        message: templateFormData.message,
      };
      setTemplates((prev) => [...prev, newTmpl]);
      showToast(`Nouveau modèle « ${templateFormData.name} » créé avec succès !`);
    }

    setEditingTemplate(null);
    setIsNewTemplateModal(false);
  };

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      showToast('Paramètres du bot WhatsApp enregistrés avec succès !');
    }, 450);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* ── Page Title & Status Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
              WhatsApp Bot
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                settings.botEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  settings.botEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              {settings.botEnabled ? 'Bot Actif' : 'Bot Inactif'}
            </span>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Automatisez les notifications de commande, le suivi de livraison et le service client via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Synchronisation avec la passerelle WhatsApp effectuée', 'info')}
            className="border border-[#E5E7EB] bg-white text-[#111827] rounded-[6px] px-3.5 py-2 text-sm font-medium hover:bg-[#F8F9FA] transition-colors flex items-center gap-2 shadow-xs"
          >
            <svg
              className="w-4 h-4 text-[#6B7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tester Connexion
          </button>
        </div>
      </div>

      {/* ── 1. STATS BAR (TOP) ────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Total messages sent */}
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Total messages sent
              </p>
              <div className="w-8 h-8 rounded-[6px] bg-indigo-50 text-[#6366F1] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-[#111827]">1,428</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
              <span>↑ 14%</span>
              <span className="text-[#6B7280] font-normal">par rapport au mois dernier</span>
            </p>
          </div>

          {/* Stat 2: Orders notified today */}
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Orders notified today
              </p>
              <div className="w-8 h-8 rounded-[6px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-[#6366F1]">47</p>
            <p className="text-xs text-[#6B7280] mt-2">
              <span className="font-medium text-[#111827]">100%</span> des commandes du jour
            </p>
          </div>

          {/* Stat 3: Success rate */}
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Success rate
              </p>
              <div className="w-8 h-8 rounded-[6px] bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-[#111827]">98.2%</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              Excellent taux de délivrabilité
            </p>
          </div>

          {/* Stat 4: Failed messages */}
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Failed messages
              </p>
              <div className="w-8 h-8 rounded-[6px] bg-red-50 text-red-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-[#EF4444]">3</p>
            <p className="text-xs text-[#6B7280] mt-2">
              Dernières 24h (numéros erronés)
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. MESSAGE TEMPLATES ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Message Templates</h2>
            <p className="text-xs text-[#6B7280]">
              Configurez les messages automatisés envoyés à chaque étape du parcours client.
            </p>
          </div>
          <button
            onClick={handleOpenNewTemplate}
            className="inline-flex items-center gap-2 bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-[8px] border border-[#E5E7EB] p-5 flex flex-col justify-between shadow-xs hover:border-[#D1D5DB] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-[#111827]">{template.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F3F4F6] text-[#4B5563]">
                    {template.triggerEvent}
                  </span>
                </div>

                <p className="text-xs text-[#6B7280] mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Message preview bubble */}
                <div className="bg-[#F8F9FA] rounded-[8px] p-3.5 border border-[#E5E7EB] mb-4 text-xs leading-relaxed text-[#374151] font-normal relative">
                  <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Message Preview</span>
                    <span className="text-[10px] lowercase text-[#6366F1] font-mono">WhatsApp</span>
                  </div>
                  <p className="whitespace-pre-wrap select-text">{template.message}</p>
                </div>

                {/* Available Variables Badges */}
                <div className="mb-4">
                  <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Variables used:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">WhatsApp Web API</span>
                <button
                  onClick={() => handleOpenEditTemplate(template)}
                  className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-3.5 py-1.5 text-xs font-medium hover:bg-[#F8F9FA] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. RECENT ACTIVITY LOG ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Recent Activity Log</h2>
            <p className="text-xs text-[#6B7280]">
              Historique en direct des messages automatiques expédiés via WhatsApp.
            </p>
          </div>
          <span className="text-xs text-[#6B7280] font-medium hidden sm:inline-block">
            8 derniers messages
          </span>
        </div>

        <div className="bg-white rounded-[8px] border border-[#E5E7EB] w-full overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#6B7280] text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-4 border-b border-[#E5E7EB]">Time</th>
                <th className="px-6 py-4 border-b border-[#E5E7EB]">Client</th>
                <th className="px-6 py-4 border-b border-[#E5E7EB]">Phone</th>
                <th className="px-6 py-4 border-b border-[#E5E7EB]">Order ID</th>
                <th className="px-6 py-4 border-b border-[#E5E7EB]">Template Used</th>
                <th className="px-6 py-4 border-b border-[#E5E7EB] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#111827] divide-y divide-[#E5E7EB]">
              {INITIAL_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8F9FA] transition-colors">
                  {/* Time */}
                  <td className="px-6 py-3.5 text-[#6B7280] text-xs whitespace-nowrap">
                    {log.time}
                  </td>

                  {/* Client */}
                  <td className="px-6 py-3.5 font-medium text-[#111827]">
                    {log.client}
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-3.5 font-mono text-xs text-[#4B5563]">
                    {log.phone}
                  </td>

                  {/* Order ID */}
                  <td className="px-6 py-3.5 text-[#6366F1] font-mono text-xs font-medium">
                    #{log.orderId}
                  </td>

                  {/* Template Used */}
                  <td className="px-6 py-3.5 text-xs text-[#374151]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                      {log.templateUsed}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    {log.status === 'Sent' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        Sent
                      </span>
                    ) : (
                      <span
                        title={log.failureReason}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 cursor-help"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 4. BOT SETTINGS ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Bot Settings</h2>
          <p className="text-xs text-[#6B7280]">
            Contrôlez les déclencheurs d’envois et les délais de notification client.
          </p>
        </div>

        <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-6 shadow-xs space-y-6">
          {/* Main Toggle: Enable / Disable */}
          <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Activer le bot WhatsApp
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Autorise l’envoi de messages automatisés vers les clientes lors des changements de statut.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((s) => ({ ...s, botEnabled: !s.botEnabled }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 ${
                settings.botEnabled ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.botEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trigger Toggles */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Déclencheurs automatiques
            </h3>

            {/* Trigger 1: Send on order confirmation */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  Send on order confirmation
                </p>
                <p className="text-xs text-[#6B7280]">
                  Envoyer automatiquement la confirmation dès validation de la commande
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    notifyOnConfirmation: !s.notifyOnConfirmation,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 ${
                  settings.notifyOnConfirmation ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifyOnConfirmation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Trigger 2: Send on shipping update */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  Send on shipping update
                </p>
                <p className="text-xs text-[#6B7280]">
                  Envoyer le message d’expédition et le numéro de suivi transporteur
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    notifyOnShipping: !s.notifyOnShipping,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 ${
                  settings.notifyOnShipping ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifyOnShipping ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Trigger 3: Send on delivery */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  Send on delivery
                </p>
                <p className="text-xs text-[#6B7280]">
                  Envoyer une demande de retour et avis lorsque le colis est marqué livré
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    notifyOnDelivery: !s.notifyOnDelivery,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 ${
                  settings.notifyOnDelivery ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifyOnDelivery ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Delay Input Field */}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <div className="max-w-xs">
              <label
                htmlFor="delay-minutes"
                className="block text-xs font-semibold text-[#111827] mb-1"
              >
                Delay before sending (in minutes)
              </label>
              <p className="text-xs text-[#6B7280] mb-2">
                Délai d’attente après un changement de statut pour permettre d’éventuelles corrections manuelles.
              </p>
              <div className="relative rounded-[6px]">
                <input
                  id="delay-minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={settings.delayMinutes}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      delayMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] bg-white pr-16 font-mono"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-[#6B7280] pointer-events-none">
                  minutes
                </span>
              </div>
            </div>
          </div>

          {/* Save Settings Button */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              Les modifications s’appliquent en temps réel sur toutes les futures commandes.
            </span>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="bg-[#18181B] text-white rounded-[6px] px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSavingSettings ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enregistrement...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Template Edit / Create Modal ─────────────────────────────────── */}
      {(editingTemplate || isNewTemplateModal) && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-y-auto py-10"
          onClick={() => {
            setEditingTemplate(null);
            setIsNewTemplateModal(false);
          }}
        >
          <div
            className="bg-white rounded-[8px] w-full max-w-xl mx-4 p-6 shadow-xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  {editingTemplate ? `Modifier le modèle : ${editingTemplate.name}` : 'Nouveau Modèle de Message'}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Personnalisez le contenu du message et insérez vos variables dynamiques.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsNewTemplateModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Nom du modèle
                </label>
                <input
                  type="text"
                  required
                  value={templateFormData.name}
                  onChange={(e) =>
                    setTemplateFormData({ ...templateFormData, name: e.target.value })
                  }
                  placeholder="ex. Order Confirmation"
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={templateFormData.description}
                  onChange={(e) =>
                    setTemplateFormData({ ...templateFormData, description: e.target.value })
                  }
                  placeholder="Brève description de quand ce modèle est déclenché..."
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#111827]">
                    Contenu du message WhatsApp
                  </label>
                  <span className="text-[11px] text-[#6B7280]">
                    Cliquez sur une variable pour l’insérer
                  </span>
                </div>

                {/* Variable inserter chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['{{client_name}}', '{{order_id}}', '{{total}}', '{{wilaya}}', '{{tracking_id}}'].map(
                    (varTag) => (
                      <button
                        key={varTag}
                        type="button"
                        onClick={() =>
                          setTemplateFormData({
                            ...templateFormData,
                            message: templateFormData.message + ' ' + varTag,
                          })
                        }
                        className="text-[11px] font-mono bg-[#F3F4F6] text-[#4B5563] hover:bg-[#EEF2FF] hover:text-[#4F46E5] border border-[#E5E7EB] rounded px-2 py-0.5 transition-colors cursor-pointer"
                      >
                        + {varTag}
                      </button>
                    )
                  )}
                </div>

                <textarea
                  rows={5}
                  required
                  value={templateFormData.message}
                  onChange={(e) =>
                    setTemplateFormData({ ...templateFormData, message: e.target.value })
                  }
                  className="w-full border border-[#E5E7EB] rounded-[6px] p-3 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] font-sans leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsNewTemplateModal(false);
                  }}
                  className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Enregistrer le modèle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ───────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-md border-l-4 p-4 min-w-[300px] flex items-center justify-between z-50 animate-fade-in-up ${
            toast.type === 'success' ? 'border-emerald-500' : 'border-[#6366F1]'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#6366F1] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p className="text-[#111827] text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

