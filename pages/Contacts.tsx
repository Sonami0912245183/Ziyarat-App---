import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, UserPlus, X, Save, Settings, Music, Pencil, ChevronDown, Check } from 'lucide-react';
import { SoundType, Contact } from '../types';

export const Contacts = () => {
  const { contacts, addNewContact, updateContact, playSound, t } = useApp();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  // newRelation stores the selected category. If 'Other', we use customRelation input.
  const [newRelation, setNewRelation] = useState<string>('Family');
  const [customRelation, setCustomRelation] = useState('');

  // Ringtone Modal State
  const [editingRingtoneId, setEditingRingtoneId] = useState<string | null>(null);
  const [selectedRingtone, setSelectedRingtone] = useState<SoundType>('default');

  const openAddModal = () => {
      setEditingContact(null);
      setNewName('');
      setNewPhone('');
      setNewRelation('Family');
      setCustomRelation('');
      setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
      setEditingContact(contact);
      setNewName(contact.name);
      setNewPhone(contact.phone);
      
      const standardRelations = ['Family', 'Friend', 'Work'];
      if (standardRelations.includes(contact.relation)) {
          setNewRelation(contact.relation);
          setCustomRelation('');
      } else {
          setNewRelation('Other');
          setCustomRelation(contact.relation === 'Other' ? '' : contact.relation);
      }
      
      setIsModalOpen(true);
  };

  const handleNativeAddContact = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        // @ts-ignore
        const selectedContacts = await navigator.contacts.select(props, opts);
        
        if (selectedContacts.length > 0) {
            for (const contact of selectedContacts) {
                const name = contact.name?.[0];
                const phone = contact.tel?.[0];
                if (name && phone) {
                    await addNewContact({
                        name: name,
                        phone: phone,
                        relation: 'Other'
                    });
                }
            }
        }
      } catch (ex) {
        console.log("Contact picker cancelled or failed", ex);
      }
    } else {
      openAddModal();
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newName && newPhone) {
          const finalRelation = newRelation === 'Other' 
            ? (customRelation.trim() || 'Other') 
            : newRelation;

          if (editingContact) {
              await updateContact(editingContact.id, {
                  name: newName,
                  phone: newPhone,
                  relation: finalRelation
              });
          } else {
              await addNewContact({
                  name: newName,
                  phone: newPhone,
                  relation: finalRelation
              });
          }
          
          setNewName('');
          setNewPhone('');
          setNewRelation('Family');
          setCustomRelation('');
          setIsModalOpen(false);
          setEditingContact(null);
      }
  };

  const openRingtoneSettings = (contact: Contact) => {
      setEditingRingtoneId(contact.id);
      setSelectedRingtone((contact.customRingtone as SoundType) || 'default');
  };

  const saveRingtone = async () => {
      if (editingRingtoneId) {
          await updateContact(editingRingtoneId, { customRingtone: selectedRingtone });
          setEditingRingtoneId(null);
      }
  };

  const getRelationLabel = (relation: string) => {
      const standardKeys: Record<string, string> = {
          'Family': 'relation_family',
          'Friend': 'relation_friend',
          'Work': 'relation_work',
          'Other': 'relation_other'
      };
      
      if (standardKeys[relation]) {
          return t(standardKeys[relation]);
      }
      return relation;
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-gray-700">{t('contacts')}</h2>
             <button 
                onClick={handleNativeAddContact}
                className="text-white bg-brand-600 hover:bg-brand-700 flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
             >
                <UserPlus size={18} /> 
                <span>{t('contact_added').replace('تمت إضافة', 'إضافة')}</span>
             </button>
        </div>

        {contacts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-gray-400">لا يوجد جهات اتصال مضافة</p>
                <button onClick={openAddModal} className="mt-2 text-brand-600 text-sm font-bold hover:underline">
                    {t('add_contact')}
                </button>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {contacts.map((contact, idx) => (
                    <div key={contact.id} className={`p-4 flex justify-between items-center ${idx !== contacts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${contact.relation === 'Family' ? 'bg-purple-50 text-purple-600 border-purple-100' : contact.relation === 'Work' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {contact.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{contact.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${contact.relation === 'Family' ? 'bg-purple-50 text-purple-600' : contact.relation === 'Work' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {getRelationLabel(contact.relation)}
                                    </span>
                                    <span className="text-xs text-gray-400">• {contact.phone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => openEditModal(contact)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => openRingtoneSettings(contact)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors ${contact.customRingtone && contact.customRingtone !== 'default' ? 'text-brand-500 bg-brand-50' : 'text-gray-400'}`}
                            >
                                <Music size={16} />
                            </button>
                            <a href={`tel:${contact.phone}`} className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100">
                                <Phone size={16} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Add/Edit Contact Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                            {editingContact ? t('edit_contact') : t('add_contact')}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('full_name')}</label>
                            <input 
                                type="text" 
                                required
                                placeholder="الاسم الكريم"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone_label')}</label>
                            <input 
                                type="tel" 
                                required
                                placeholder="05xxxxxxxx"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('relation_label')}</label>
                            <div className="flex flex-wrap gap-2">
                                {['Family', 'Friend', 'Work', 'Other'].map((rel) => (
                                    <button
                                        key={rel}
                                        type="button"
                                        onClick={() => setNewRelation(rel)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border flex-1 ${
                                            newRelation === rel 
                                            ? 'bg-brand-500 text-white border-brand-500 shadow-md transform scale-105' 
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {t(`relation_${rel.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {newRelation === 'Other' && (
                            <div className="animate-fade-in-down">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('relation_other')}</label>
                                <input 
                                    type="text" 
                                    placeholder={t('relation_custom_placeholder')}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                                    value={customRelation}
                                    onChange={(e) => setCustomRelation(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {t('save')}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Custom Ringtone Modal */}
        {editingRingtoneId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{t('set_ringtone_for')} {contacts.find(c => c.id === editingRingtoneId)?.name}</h3>
                        <button onClick={() => setEditingRingtoneId(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2 mb-6">
                        {(['default', 'chime', 'bell', 'futuristic'] as SoundType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => {
                                    setSelectedRingtone(type);
                                    playSound(type);
                                }}
                                className={`w-full p-3 rounded-xl flex items-center justify-between border transition-all ${selectedRingtone === type ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                            >
                                <span className="font-bold text-sm">
                                    {type === 'default' ? t('sound_default') : 
                                     type === 'chime' ? t('sound_chime') :
                                     type === 'bell' ? t('sound_bell') :
                                     t('sound_futuristic')}
                                </span>
                                {selectedRingtone === type && <div className="w-3 h-3 bg-brand-500 rounded-full"></div>}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={saveRingtone}
                        className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100"
                    >
                        {t('assign_tone')}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};