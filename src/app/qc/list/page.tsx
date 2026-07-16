'use client'
import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import api from '@/lib/api'
import { QCContent, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { Search, Filter, Loader2, Download, X, AlertTriangle, Archive, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STATUS_ORDER: StatusEnum[] = [
  'QC Process', 'QC Done', 'Uploading', 'Ready To Ingest',
  'Ingesting', 'Done Ingest', 'Need Revised', 'Material Revised', 'Revised',
]
const STATUSES: StatusEnum[] = [
  'QC Process', 'QC Done', 'Uploading', 'Ready To Ingest',
  'Ingesting', 'Done Ingest', 'Need Revised', 'Material Revised', 'Revised',
]

// ââ ReviseModal âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function ReviseModal({
  onClose, onSubmit, loading, mode,
}: {
  onClose: () => void
  onSubmit: (notes: string) => void
  loading: boolean
  mode: 'revise' | 'return'
}) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
          {mode === 'return' ? 'Kembalikan ke Material Handling' : 'Revise'}
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Catatan revisi..."
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm h-28 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300"
          >Cancel</button>
          <button
            onClick={() => onSubmit(notes)}
            disabled={loading || !notes.trim()}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Kirim'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ââ InfoRow helper ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400 text-sm">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100 text-sm text-right">{value}</span>
    </div>
  )
}

// ââ QCFormPanel (popup form at z-50) âââââââââââââââââââââââââââââââââââââââââ
function QCFormPanel({ item, onClose, onSubmitted }: {
  item: any
  onClose: () => void
  onSubmitted: () => void
}) {
  const [qcErrorTypes, setQcErrorTypes] = useState<Record<string, any[]>>({})
  const [qcItems, setQcItems] = useState<Record<number, 'pass' | 'fail'>>({})
  const [intimateScene, setIntimateScene] = useState<'pass' | 'fail'>('pass')
  const [goreScene, setGoreScene] = useState<'pass' | 'fail'>('pass')
  const [ratingAge, setRatingAge] = useState('')
  const [finalResult, setFinalResult] = useState<'PASS' | 'CONDITIONAL' | 'FAIL'>('PASS')
  const [conditionNote, setConditionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/qc-error-types').then(r => {
      setQcErrorTypes(r.data)
      const init: Record<number, 'pass' | 'fail'> = {}
      Object.values(r.data as Record<string, any[]>).flat().forEach((et: any) => { init[et.id] = 'pass' })
      setQcItems(init)
    }).finally(() => setLoading(false))
  }, [])

  const submitQCResult = async () => {
    setSubmitting(true)
    try {
      const items = Object.entries(qcItems).map(([etId, status]) => ({
        error_type_id: Number(etId), status,
      }))
      await api.post('/qc-results/', {
        qc_content_id: item?.id,
        library_id: item?.library_id,
        intimate_scene: intimateScene,
        gore_scene: goreScene,
        rating_age: ratingAge || null,
        final_result: finalResult,
        condition_note: conditionNote || null,
        auto_pass: false,
        items,
      })
      onSubmitted()
      onClose()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal submit QC.') }
    finally { setSubmitting(false) }
  }

  const autoPass = async () => {
    if (!window.confirm('Auto Pass: semua item akan ditandai PASS. Lanjut?')) return
    setSubmitting(true)
    try {
      await api.post('/qc-results/', {
        qc_content_id: item?.id,
        library_id: item?.library_id,
        intimate_scene: 'pass',
        gore_scene: 'pass',
        rating_age: ratingAge || null,
        final_result: 'PASS',
        condition_note: null,
        auto_pass: true,
        items: [],
      })
      onSubmitted()
      onClose()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal auto pass.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header â shrink-0 so it never shrinks */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{item?.qcid ?? 'â'}</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Form QC Intake</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body â flex-1 takes remaining space, overflow-y-auto enables scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat error types...
            </div>
          ) : (
            <>
              {/* Error type items */}
              {Object.entries(qcErrorTypes).map(([category, errors]) => (
                <div key={category} className="border border-slate-200 dark:b/rder-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{category}</p>
                  </div>
                  <div className="px-4 py-3 space-y-2.5">
                    {errors.map((et: any) => (
                      <div key={et.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{et.error_name}</span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => setQcItems(p => ({ ...p, [et.id]: 'pass' }))}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              qcItems[et.id] === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >Pass</button>
                          <button
                            onClick={() => setQcItems(p => ({ ...p, [et.id]: 'fail' }))}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              qcItems[et.id] === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >Fail</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Scene & Rating */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scene & Rating</p>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Intimate Scene</span>
                    <div className="flex gap-1">
                      <button onClick={() => setIntimateScene('pass')}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${intimateScene === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                      >Pass</button>
                      <button onClick={() => setIntimateScene('fail')}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${intimateScene === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                      >Fail</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Gore Scene</span>
                    <div className="flex gap-1">
                      <button onClick={() => setGoreScene('pass')}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${goreScene === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                      >Pass</button>
                      <button onClick={() => setGoreScene('fail')}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${goreScene === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bt-slate-700 text-slate-500 dark:text-slate-400'}`}
                      >Fail</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Rating Usia</label>
                    <select
                      value={ratingAge}
                      onChange={e => setRatingAge(e.target.value)}
                      className="wtext-xs rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"Æ'WGFöâöä6Æ6³×²Óâ6WDv÷&U66VæRvfÂrÐ¢6Æ74æÖS×¶FWB×2Ó"ãRÓ&÷VæFVBÖgVÆÂföçBÖÖVFVÒG¶v÷&U66VæRÓÓÒvfÂròv&r×&VBÓSFWB×vFRr¢v&r×6ÆFRÓF&³¦&r×6ÆFRÓsFWB×6ÆFRÓSF&³§FWB×6ÆFRÓCwÖÐ¢äfÃÂö'WGFöãà¢ÂöFcà¢ÂöFcà¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ'FWB×2föçBÖÖVFVÒFWB×6ÆFRÓSF&³§FWB×6ÆFRÓC&Æö6²Ö"Ó#å&FærW6ÂöÆ&VÃà¢Ç6VÆV7@¢fÇVS×·&FætvWÐ¢öä6ævS×¶RÓâ6WE&FætvRRçF&vWBçfÇVRÐ¢6Æ74æÖSÒ'rÖgVÆÂ&÷&FW"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓc&÷VæFVBÖÆrÓ2Ó"FWB×6Ò&r×vFRF&³¦&r×6ÆFRÓsFWB×6ÆFRÓF&³§FWB×6ÆFRÓfö7W3¦÷WFÆæRÖæöæRfö7W3§&ærÓ"fö7W3§&ærÖ&ÇVRÓS ¢à¢Æ÷FöâfÇVSÒ"#âfÖF6²Æ&FærfÖF6³Âö÷Föãà¢µ²u5RrÂurÂs2²rÂsr²rÂs#²rÂtBuÒæÖ"Óâ¢Æ÷Föâ¶W×·'ÒfÇVS×·'Óç·'ÓÂö÷Föãà¢Ð¢Â÷6VÆV7Cà¢ÂöFcà¢ÂöFcà¢ÂöFcà ¢²ò¢fæÂ&W7VÇB¢÷Ð¢ÆFb6Æ74æÖSÒ&&÷&FW"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓs&÷VæFVB×Â÷fW&fÆ÷rÖFFVâ#à¢ÆFb6Æ74æÖSÒ'ÓBÓ"ãR&r×6ÆFRÓSF&³¦&r×6ÆFRÓ&÷&FW"Ö"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓs#à¢Ç6Æ74æÖSÒ'FWB×2föçB×6VÖ&öÆBFWB×6ÆFRÓSF&³§FWB×6ÆFRÓCWW&66RG&6¶ær×vFW"#äfæÂ&W7VÇCÂ÷à¢ÂöFcà¢ÆFb6Æ74æÖSÒ'ÓBÓ276R×Ó2#à¢ÆFb6Æ74æÖSÒ&fÆWvÓ"#à¢²²u52rÂt4ôäDDôäÂrÂtdÂuÒ26öç7BæÖ"Óâ¢Æ'WGFöà¢¶W×·'Ð¢öä6Æ6³×²Óâ6WDfæÅ&W7VÇB"Ð¢6Æ74æÖS×¶fÆWÓÓ"&÷VæFVBÖÆrFWB×2föçB×6VÖ&öÆBG&ç6FöâÖ6öÆ÷'2G°¢fæÅ&W7VÇBÓÓÒ ¢ò"ÓÓÒu52ròv&rÖw&VVâÓSFWB×vFRr¢"ÓÓÒtdÂròv&r×&VBÓSFWB×vFRr¢v&r×VÆÆ÷rÓSFWB×vFRp¢¢v&r×6ÆFRÓF&³¦&r×6ÆFRÓsFWB×6ÆFRÓcF&³§FWB×6ÆFRÓ3p¢ÖÐ¢ç·'ÓÂö'WGFöãà¢Ð¢ÂöFcà¢¶fæÅ&W7VÇBÓÓÒt4ôäDDôäÂrbb¢ÇFWF&V¢fÇVS×¶6öæFFöäæ÷FWÐ¢öä6ævS×¶RÓâ6WD6öæFFöäæ÷FRRçF&vWBçfÇVRÐ¢Æ6VöÆFW#Ò$6FFâ¶öæF6âââ ¢6Æ74æÖSÒ'rÖgVÆÂ&÷&FW"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓc&÷VæFVBÖÆrÓ2FWB×6ÒÓ#&W6¦RÖæöæR&r×vFRF&³¦&r×6ÆFRÓsFWB×6ÆFRÓF&³§FWB×6ÆFRÓfö7W3¦÷WFÆæRÖæöæRfö7W3§&ærÓ"fö7W3§&ærÖ&ÇVRÓS ¢óà¢Ð¢ÂöFcà¢ÂöFcà¢Âóà¢Ð¢ÂöFcà ¢²ò¢7F6·fö÷FW"(	B6&æ²Ó6òBÇv27F2f6&ÆR¢÷Ð¢²ÆöFærbb¢ÆFb6Æ74æÖSÒ'6&æ²Ó&÷&FW"×B&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓs&r×vFRF&³¦&r×6ÆFRÓÓBÓ2fÆWvÓ"#à¢Æ'WGFöà¢öä6Æ6³×¶WFõ77Ð¢F6&ÆVC×·7V&ÖGFæwÐ¢6Æ74æÖSÒ'ÓBÓ"ãR&÷VæFVB×Â&÷&FW"&÷&FW"Öw&VVâÓSFWBÖw&VVâÓcF&³§FWBÖw&VVâÓCFWB×6ÒföçBÖÖVFVÒF6&ÆVC¦÷6GÓS ¢äWFò73Âö'WGFöãà¢Æ'WGFöà¢öä6Æ6³×·7V&ÖE5&W7VÇGÐ¢F6&ÆVC×·7V&ÖGFæwÐ¢6Æ74æÖSÒ&fÆWÓÓ"ãR&÷VæFVB×Â&rÖ&ÇVRÓSFWB×vFRFWB×6ÒföçB×6VÖ&öÆBF6&ÆVC¦÷6GÓSfÆWFV×2Ö6VçFW"§W7FgÖ6VçFW"vÓ" ¢à¢·7V&ÖGFærbbÄÆöFW#"6Æ74æÖSÒ'rÓBÓBæÖFR×7â"óçÐ¢·7V&ÖGFæròu7V&ÖGFærâââr¢u7V&ÖB2wÐ¢Âö'WGFöãà¢ÂöFcà¢Ð¢ÂöFcà¢ÂöFcà¢§Ð ¢òò)H)H4FWFÅæVÂ6FRæVÂ)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¦gVæ7Föâ4FWFÅæVÂ²BÂöä6Æ÷6RÂöäÆ7E&Vg&W6Ó¢°¢C¢çVÖ&W#²öä6Æ÷6S¢ÓâföC²öäÆ7E&Vg&W6¢Óâfö@§Ò°¢6öç7B²W6W"ÒÒW6TWF¢6öç7B&öÆRÒW6W#òç&öÆRóòrp¢6öç7B²FF¢FVÒÂ4ÆöFærÂ×WFFRÒÒW6U5u#Æçâ÷2òG¶GÖÂfWF6W"¢6öç7B¶Gfæ6ærÂ6WDGfæ6æuÒÒW6U7FFRfÇ6R¢6öç7B·6÷t7F÷'Â6WE6÷t7F÷'ÒÒW6U7FFRfÇ6R¢6öç7B·6÷u&Wf6TÖöFÂÂ6WE6÷u&Wf6TÖöFÅÒÒW6U7FFRfÇ6R¢6öç7B·6÷u4f÷&ÒÂ6WE6÷u4f÷&ÕÒÒW6U7FFRfÇ6R¢6öç7B·&Wf6ærÂ6WE&Wf6æuÒÒW6U7FFRfÇ6R¢6öç7B¶VFFætæÖærÂ6WDVFFætæÖæuÒÒW6U7FFRfÇ6R¢6öç7B¶æÖæufÂÂ6WDæÖæufÅÒÒW6U7FFRrr¢6öç7B·6fætæÖærÂ6WE6fætæÖæuÒÒW6U7FFRfÇ6R¢6öç7B·7V'4WæFVBÂ6WE7V'4WæFVEÒÒW6U7FFRfÇ6R¢6öç7B·7V'4FFÂ6WE7V'4FFÒÒW6U7FFSÆçµÓâµÒ¢6öç7B¶ÆöFæu7V'2Â6WDÆöFæu7V'5ÒÒW6U7FFRfÇ6R¢6öç7B¶VFFæu7V'52Â6WDVFFæu7V'55ÒÒW6U7FFSÆçVÖ&W"ÂçVÆÃâçVÆÂ¢6öç7B·5fÂÂ6WE5fÅÒÒW6U7FFRrr¢6öç7B·vF7V'4VFFærÂ6WEvF7V'4VFFæuÒÒW6U7FFRfÇ6R¢6öç7B¶GV&$WæFVBÂ6WDGV&$WæFVEÒÒW6U7FFRfÇ6R¢6öç7B¶GV&$FFÂ6WDGV&$FFÒÒW6U7FFSÆçµÓâµÒ¢6öç7B¶ÆöFætGV&"Â6WDÆöFætGV&%ÒÒW6U7FFRfÇ6R¢6öç7B¶VFFætGV&%2Â6WDVFFætGV&%5ÒÒW6U7FFSÆçVÖ&W"ÂçVÆÃâçVÆÂ¢6öç7B¶GV&%5fÂÂ6WDGV&%5fÅÒÒW6U7FFRrr¢6öç7B·vFGV&$VFFærÂ6WEvFGV&$VFFæuÒÒW6U7FFRfÇ6R ¢6öç7B43¢&V6÷&CÇ7G&ærÂ7G&æsâÒ°¢VæFæs¢v&r×6ÆFRÓFWB×6ÆFRÓSF&³¦&r×6ÆFRÓF&³§FWB×6ÆFRÓCrÀ¢å÷&öw&W73¢v&r×VÆÆ÷rÓFWB×VÆÆ÷rÓsF&³¦&r×VÆÆ÷rÓó3F&³§FWB×VÆÆ÷rÓCrÀ¢FöæS¢v&rÖw&VVâÓFWBÖw&VVâÓsF&³¦&rÖw&VVâÓó3F&³§FWBÖw&VVâÓCrÀ¢Ð¢6öç7B4Ã¢&V6÷&CÇ7G&ærÂ7G&æsâÒ²VæFæs¢uVæFærrÂå÷&öw&W73¢tâ&öw&W72rÂFöæS¢tFöæRrÐ ¢6öç7BÆöE7V'F6·2Ò7æ2Óâ°¢6WDÆöFæu7V'2G'VR¢G'²6öç7B&W2ÒvBævWB÷7V'2òG¶GÒ÷F6·6²6WE7V'4FF&W2æFFÒ6F6·Ð¢6WDÆöFæu7V'2fÇ6R¢Ð¢6öç7BWFFU7V%F6²Ò7æ2FC¢çVÖ&W"ÂWC¢²7FGW3ó¢7G&æs²3ó¢7G&ærÒÓâ°¢vBçF6÷7V'2òG¶GÒ÷F6·2òG·FGÖÂWB²ÆöE7V'F6·2¢Ð¢6öç7BFövvÆUvF7V'2Ò7æ2fÃ¢&ööÆVâÓâ°¢vBçF6÷2òG¶GÖÂ²vF÷7V'3¢fÂÒ²×WFFR¢bfÂ6WEFÖV÷WBÆöE7V'F6·2ÂS²6WEvF7V'4VFFærfÇ6R¢Ð¢6öç7BÆöDGV&%F6·2Ò7æ2Óâ°¢6WDÆöFætGV&"G'VR¢G'²6öç7B&W2ÒvBævWB÷7V'2òG¶GÒ÷F6·3÷F6µ÷GSÖGV&&²6WDGV&$FF&W2æFFÒ6F6·Ð¢6WDÆöFætGV&"fÇ6R¢Ð¢6öç7BWFFTGV&%F6²Ò7æ2FC¢çVÖ&W"ÂWC¢²7FGW3ó¢7G&æs²3ó¢7G&ærÒÓâ°¢vBçF6÷7V'2òG¶GÒ÷F6·2òG·FGÖÂWB²ÆöDGV&%F6·2¢Ð¢6öç7BFövvÆUvFGV&"Ò7æ2fÃ¢&ööÆVâÓâ°¢vBçF6÷2òG¶GÖÂ²vFöGV&#¢fÂÒ²×WFFR¢bfÂ6WEFÖV÷WBÆöDGV&%F6·2ÂS²6WEvFGV&$VFFærfÇ6R¢Ð¢6öç7B6fTæÖærÒ7æ2Óâ°¢bæÖæufÂçG&Ò&WGW&à¢6WE6fætæÖærG'VR¢G'°¢vBçF6÷2òG¶GÒöæÖærÖ76WFÂ²æÖæuö76WC¢æÖæufÂçG&ÒÒ¢×WFFR²6WDVFFætæÖærfÇ6R¢Ò6F6²ÆW'BtvvÂÖVç×âæÖær76WBrÐ¢fæÆÇ²6WE6fætæÖærfÇ6RÐ¢Ð¢6öç7BGfæ6U7FGW2Ò7æ2F&vWE7FGW3ó¢7G&ærÓâ°¢6öç7B7W'&VçDGÒFVÒò5DEU5ôõ$DU"ææFWöbFVÒç7FGW227FGW4VçVÒ¢Ó¢6öç7BF&vWBÒF&vWE7FGW2óòFVÒò5DEU5ôõ$DU%¶7W'&VçDG²ÒóòçVÆÂ¢çVÆÂ¢bF&vWBÇÂFVÒ&WGW&à¢bFVÒçvF÷7V'2bb7V'4FFæÆVæwFâ°¢6öç7Bæ÷DFöæRÒ7V'4FFæfÇFW"C¢çÓâBç7FGW2ÓÒvFöæRr¢bæ÷DFöæRæÆVæwFâbbvæF÷ræ6öæf&Ò)ªûòG¶æ÷DFöæRæÆVæwFÒ&67V'FFÆR&VÇVÒ6VÆW6åÆåÆäÆæ§WCö&WGW&à¢Ð¢bF&vWBÓÓÒu&VGFòævW7BrbbFVÒææÖæuö76WB°¢bvæF÷ræ6öæf&Ò~)ªûòæÖær76WB&VÇVÒF6åÆåÆä¶Æ²ô²VçGV²Ææ§WBFçæÖær76WBâr&WGW&à¢Ð¢6WDGfæ6ærG'VR¢G'°¢vBçF6÷2òG¶GÒ÷7FGW6Â²æWu÷7FGW3¢F&vWBÒ¢×WFFR²öäÆ7E&Vg&W6¢Ò6F6W'#¢ç²ÆW'BW'#òç&W7öç6SòæFFòæFWFÂÇÂtvvÂÖVæwV&7FGW2ârÐ¢fæÆÇ²6WDGfæ6ærfÇ6RÐ¢Ð¢6öç7B&W7V&ÖBÒ7æ2Óâ°¢bFVÒbbFVÒææÖæuö76WB°¢bvæF÷ræ6öæf&Ò~)ªûòæÖær76WB&VÇVÒF6åÆåÆä¶Æ²ô²VçGV²Ææ§WBâr&WGW&à¢Ð¢6WDGfæ6ærG'VR¢G'°¢vBçF6÷2òG¶GÒ÷7FGW6Â²æWu÷7FGW3¢u&VGFòævW7BrÒ¢×WFFR²öäÆ7E&Vg&W6¢Ò6F6W'#¢ç²ÆW'BW'#òç&W7öç6SòæFFòæFWFÂÇÂtvvÂÖVæv&ÒVÆærârÐ¢fæÆÇ²6WDGfæ6ærfÇ6RÐ¢Ð¢6öç7B&WGW&åFôÔÒ7æ2æ÷FW3¢7G&ærÓâ°¢6WE&Wf6ærG'VR¢G'°¢vBçF6öÖFW&ÂòG¶GÒ÷&WGW&â×FòÖÖÂ²æ÷FW2Ò¢×WFFR²öäÆ7E&Vg&W6²6WE6÷u&Wf6TÖöFÂfÇ6R¢Ò6F6W'#¢ç²ÆW'BW'#òç&W7öç6SòæFFòæFWFÂÇÂtvvÂÖVævVÖ&Æ¶â¶RÔârÐ¢fæÆÇ²6WE&Wf6ærfÇ6RÐ¢Ð¢6öç7BæFÆU&Wf6RÒ7æ2æ÷FW3¢7G&ærÓâ°¢6WE&Wf6ærG'VR¢G'°¢bFVÓòç6B°¢vBçF6ö6×2öFVÒòG¶FVÒç6GÒ÷&Wf6VFÂ²÷W&F÷%öæÖS¢W6W#òææÖRóòt4Õ2rÂ&Wf6VEöæ÷FW3¢æ÷FW2Ò¢ÒVÇ6R°¢vBçF6÷2òG¶GÒ÷&Wf6VÂ²&Wf6VEöæ÷FW3¢æ÷FW2Ò¢Ð¢×WFFR²öäÆ7E&Vg&W6²6WE6÷u&Wf6TÖöFÂfÇ6R¢Ò6F6W'#¢ç²ÆW'BW'#òç&W7öç6SòæFFòæFWFÂÇÂtvvÂ&Wf6RârÐ¢fæÆÇ²6WE&Wf6ærfÇ6RÐ¢Ð ¢6öç7B4VFF÷"Ò&öÆRÓÓÒvVFF÷"rÇÂ&öÆRÓÓÒv6VeöVFF÷"rÇÂ&öÆRÓÓÒvFÖâp¢6öç7B57WW'f6÷"Ò&öÆRÓÓÒvFÖârÇÂ&öÆRÓÓÒv6VeöVFF÷"p ¢&WGW&â¢ÆFb6Æ74æÖSÒ&fVBç6WBÓ¢ÓCfÆW§W7FgÖVæB"öä6Æ6³×¶öä6Æ÷6WÓà¢ÆFb6Æ74æÖSÒ&'6öÇWFRç6WBÓ&rÖ&Æ6²ó#F&³¦&rÖ&Æ6²óC"óà¢ÆF`¢6Æ74æÖSÒ'&VÆFfRrÖgVÆÂÖ×rÖÆr&r×vFRF&³¦&r×6ÆFRÓÖgVÆÂ÷fW&fÆ÷r×ÖWFò6F÷rÓ'ÂfÆWfÆWÖ6öÂ ¢öä6Æ6³×¶RÓâRç7F÷&÷vFöâÐ¢à¢²ò¢7F6·VFW"¢÷Ð¢ÆFb6Æ74æÖSÒ'7F6·F÷Ó¢Ó&r×vFRF&³¦&r×6ÆFRÓ&÷&FW"Ö"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓsÓBÓ2fÆWFV×2×7F'B§W7FgÖ&WGvVVâvÓ"#à¢ÆFb6Æ74æÖSÒ&Öâ×rÓ#à¢Ç6Æ74æÖSÒ'FWB×2föçBÖÖöæòFWB×6ÆFRÓCF&³§FWB×6ÆFRÓS#ç¶FVÓòç6Bóò~(	Bw×Â÷à¢Ç6Æ74æÖSÒ&föçB×6VÖ&öÆBFWB×6ÆFRÓF&³§FWB×6ÆFRÓG'Væ6FR#ç¶FVÓòçFFÆRóò~(
bwÓÂ÷à¢¶FVÓòç6V6öâbb¢Ç6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓSF&³§FWB×6ÆFRÓC#å7¶FVÒç6V6öçÒW¶FVÒæW6öFWÓÂ÷à¢Ð¢ÂöFcà¢Æ'WGFöâöä6Æ6³×¶öä6Æ÷6WÒ6Æ74æÖSÒ'6&æ²ÓÓ&÷VæFVBÖÆr÷fW#¦&r×6ÆFRÓF&³¦÷fW#¦&r×6ÆFRÓ#à¢Å6Æ74æÖSÒ'rÓRÓRFWB×6ÆFRÓS"óà¢Âö'WGFöãà¢ÂöFcà ¢¶4ÆöFærbb¢ÆFb6Æ74æÖSÒ&fÆWÓfÆWFV×2Ö6VçFW"§W7FgÖ6VçFW"Ób#à¢ÄÆöFW#"6Æ74æÖSÒ'rÓbÓbæÖFR×7âFWBÖ&ÇVRÓS"óà¢ÂöFcà¢Ð ¢²4ÆöFærbbFVÒbb¢ÆFb6Æ74æÖSÒ'ÓB76R×ÓB"Ó#à¢²ò¢7FGW2&FvW2¢÷Ð¢ÆFb6Æ74æÖSÒ&fÆWfÆW×w&vÓ"#à¢Å7FGW4&FvR7FGW3×¶FVÒç7FGW7Òóà¢¶FVÒç5÷&W7VÇBbb¢Ç7â6Æ74æÖS×¶FWB×2föçB×6VÖ&öÆBÓ"Ó&÷VæFVBÖgVÆÂG°¢FVÒç5÷&W7VÇBÓÓÒu52p¢òv&rÖw&VVâÓFWBÖw&VVâÓsF&³¦&rÖw&VVâÓó3F&³§FWBÖw&VVâÓCp¢¢FVÒç5÷&W7VÇBÓÓÒtdÂp¢òv&r×&VBÓFWB×&VBÓsF&³¦&r×&VBÓó3F&³§FWB×&VBÓCp¢¢v&r×VÆÆ÷rÓFWB×VÆÆ÷rÓsF&³¦&r×VÆÆ÷rÓó3F&³§FWB×VÆÆ÷rÓCp¢ÖÓç¶FVÒç5÷&W7VÇGÓÂ÷7ãà¢Ð¢ÂöFcà ¢²ò¢&Wf6&ææW"¢÷Ð¢¶FVÒç7FGW2ÓÓÒtæVVB&Wf6VBrbbFVÒç&Wf6VEöæ÷FW2bb¢ÆFb6Æ74æÖSÒ&&r×&VBÓSF&³¦&r×&VBÓó#&÷&FW"&÷&FW"×&VBÓ#F&³¦&÷&FW"×&VBÓ&÷VæFVBÖÆrÓ2#à¢Ç6Æ74æÖSÒ'FWB×2föçB×6VÖ&öÆBFWB×&VBÓcF&³§FWB×&VBÓCÖ"ÓfÆWFV×2Ö6VçFW"vÓ#à¢ÄÆW'EG&ævÆR6Æ74æÖSÒ'rÓ2Ó2"óâ6FFâ&Wf6¢Â÷à¢Ç6Æ74æÖSÒ'FWB×2FWB×&VBÓsF&³§FWB×&VBÓ3vFW76R×&R×w&#ç¶FVÒç&Wf6VEöæ÷FW7ÓÂ÷à¢ÂöFcà¢Ð ¢²ò¢æfò6&B¢÷Ð¢ÆFb6Æ74æÖSÒ&&r×6ÆFRÓSF&³¦&r×6ÆFRÓ&÷VæFVB×ÂÓB76R×Ó"#à¢Äæfõ&÷rÆ&VÃÒ$Æ'&'B"fÇVS×¶FVÒæÆ'&'öBóò~(	BwÒóà¢Äæfõ&÷rÆ&VÃÒ%ÆFf÷&Ò"fÇVS×¶FVÒçÆFf÷&Òóò~(	BwÒóà¢Äæfõ&÷rÆ&VÃÒ%FR"fÇVS×¶FVÒæ6öçFVçE÷GRóò~(	BwÒóà¢Äæfõ&÷rÆ&VÃÒ$VFF÷""fÇVS×¶FVÒç5öVFF÷%öæÖRóò~(	BwÒóà¢Äæfõ&÷rÆ&VÃÒ%FævvÂ"fÇVS×¶FVÒæ7&VFVEöBòæWrFFRFVÒæ7&VFVEöBçFôÆö6ÆTFFU7G&ærvBÔBr¢~(	BwÒóà¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâvÓ"BÓ"&÷&FW"×B&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓs#à¢Ç7â6Æ74æÖSÒ'FWB×6ÆFRÓSF&³§FWB×6ÆFRÓCFWB×6Ò#äæÖær76WCÂ÷7ãà¢¶VFFætæÖærò¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓfÆWÓ§W7FgÖVæB#à¢ÆçW@¢fÇVS×¶æÖæufÇÐ¢öä6ævS×¶RÓâ6WDæÖæufÂRçF&vWBçfÇVRÐ¢6Æ74æÖSÒ&&÷&FW"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓc&÷VæFVBÓ"ÓãRFWB×2rÓ3"&r×vFRF&³¦&r×6ÆFRÓsFWB×6ÆFRÓF&³§FWB×6ÆFRÓ ¢Æ6VöÆFW#Ò$æÖær76WBâââ ¢WFôfö7W0¢óà¢Æ'WGFöâöä6Æ6³×·6fTæÖæwÒF6&ÆVC×·6fætæÖæwÐ¢6Æ74æÖSÒ'FWB×2&rÖ&ÇVRÓSFWB×vFRÓ"ÓãR&÷VæFVBF6&ÆVC¦÷6GÓS ¢ç·6fætæÖærò~(
br¢u6fRwÓÂö'WGFöãà¢Æ'WGFöâöä6Æ6³×²Óâ6WDVFFætæÖærfÇ6RÒ6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓSÓ#î)ÉSÂö'WGFöãà¢ÂöFcà¢¢¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖSÒ&föçBÖÖVFVÒFWB×6ÆFRÓF&³§FWB×6ÆFRÓFWB×6ÒFWB×&vB#à¢¶FVÒææÖæuö76WBóò~(	BwÐ¢Â÷7ãà¢¶4VFF÷"bb¢Æ'WGFöà¢öä6Æ6³×²Óâ²6WDæÖæufÂFVÒææÖæuö76WBóòrr²6WDVFFætæÖærG'VR×Ð¢6Æ74æÖSÒ'FWB×2FWBÖ&ÇVRÓS÷fW#§FWBÖ&ÇVRÓs ¢äVFCÂö'WGFöãà¢Ð¢ÂöFcà¢Ð¢ÂöFcà¢ÂöFcà ¢²ò¢2f÷&Ò'WGFöâ(	BöæÇâ2&ö6W72¢÷Ð¢¶FVÒç7FGW2ÓÓÒu2&ö6W72rbb4VFF÷"bb¢Æ'WGFöà¢öä6Æ6³×²Óâ6WE6÷u4f÷&ÒG'VRÐ¢6Æ74æÖSÒ'rÖgVÆÂfÆWFV×2Ö6VçFW"§W7FgÖ6VçFW"vÓ"Ó2&÷VæFVB×Â&rÖ&ÇVRÓSFWB×vFRFWB×6ÒföçB×6VÖ&öÆB÷fW#¦&rÖ&ÇVRÓcG&ç6FöâÖ6öÆ÷'2 ¢à¢Ä6Æ&ö&DÆ7B6Æ74æÖSÒ'rÓBÓB"óà¢'V¶f÷&Ò2çF¶P¢Âö'WGFöãà¢Ð ¢²ò¢7V'FFÆR6V7Föâ¢÷Ð¢²FVÒçvF÷7V'2ÇÂvF7V'4VFFærÇÂ57WW'f6÷"bb¢ÆFb6Æ74æÖSÒ&&÷&FW"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓs&÷VæFVB×Â÷fW&fÆ÷rÖFFVâ#à¢Æ'WGFöà¢6Æ74æÖSÒ'rÖgVÆÂfÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâÓBÓ2&r×6ÆFRÓSF&³¦&r×6ÆFRÓFWB×6ÒföçBÖÖVFVÒFWB×6ÆFRÓsF&³§FWB×6ÆFRÓ3 ¢öä6Æ6³×²Óâ°¢b7V'4WæFVB²6WE7V'4WæFVBG'VR²bFVÒçvF÷7V'2ÆöE7V'F6·2Ð¢VÇ6R6WE7V'4WæFVBfÇ6R¢×Ð¢à¢Ç7â6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"#à¢7V'FFÆP¢Ç7â6Æ74æÖS×¶FWB×2Ó"ÓãR&÷VæFVBÖgVÆÂG°¢FVÒçvF÷7V'0¢òv&rÖ&ÇVRÓFWBÖ&ÇVRÓsF&³¦&rÖ&ÇVRÓó3F&³§FWBÖ&ÇVRÓCp¢¢v&r×6ÆFRÓFWB×6ÆFRÓSF&³¦&r×6ÆFRÓsF&³§FWB×6ÆFRÓCp¢ÖÓç¶FVÒçvF÷7V'2òt·Fbr¢tæöæ·FbwÓÂ÷7ãà¢Â÷7ãà¢·7V'4WæFVBòÄ6Wg&öåW6Æ74æÖSÒ'rÓBÓB"óâ¢Ä6Wg&öäF÷vâ6Æ74æÖSÒ'rÓBÓB"óçÐ¢Âö'WGFöãà¢·7V'4WæFVBbb¢ÆFb6Æ74æÖSÒ'ÓBÓ276R×Ó2#à¢¶57WW'f6÷"bb¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"#à¢·vF7V'4VFFærò¢Ãà¢Æ'WGFöâöä6Æ6³×²ÓâFövvÆUvF7V'2G'VRÐ¢6Æ74æÖSÒ'FWB×2&rÖ&ÇVRÓSFWB×vFRÓ2Ó&÷VæFVBÖgVÆÂ#ä·Ff¶ãÂö'WGFöãà¢Æ'WGFöâöä6Æ6³×²ÓâFövvÆUvF7V'2fÇ6RÐ¢6Æ74æÖSÒ'FWB×2&r×6ÆFRÓ#F&³¦&r×6ÆFRÓsFWB×6ÆFRÓsF&³§FWB×6ÆFRÓ3Ó2Ó&÷VæFVBÖgVÆÂ#äæöæ·Ff¶ãÂö'WGFöãà¢Æ'WGFöâöä6Æ6³×²Óâ6WEvF7V'4VFFærfÇ6RÒ6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓS#ä&FÃÂö'WGFöãà¢Âóà¢¢¢Æ'WGFöâöä6Æ6³×²Óâ6WEvF7V'4VFFærG'VRÒ6Æ74æÖSÒ'FWB×2FWBÖ&ÇVRÓS÷fW#§FWBÖ&ÇVRÓs#à¢V&7FGW27V'FFÆP¢Âö'WGFöãà¢Ð¢ÂöFcà¢Ð¢¶FVÒçvF÷7V'2bb¢ÆöFæu7V'2ò¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"FWB×2FWB×6ÆFRÓS#à¢ÄÆöFW#"6Æ74æÖSÒ'rÓ2Ó2æÖFR×7â"óâÆöFærââà¢ÂöFcà¢¢7V'4FFæÆVæwFÓÓÒò¢Ç6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓC#ä&VÇVÒF7V'FFÆRF6²ãÂ÷à¢¢¢ÆFb6Æ74æÖSÒ'76R×Ó"#à¢·7V'4FFæÖC¢çÓâ¢ÆFb¶W×·BæGÒ6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâvÓ"FWB×2#à¢0               <span className="text-slate-700 dark:text-slate-300 font-medium">{t.language}</span>
                              <div className="flex items-center gap-2">
                                {editingSubsPic === t.id ? (
                                  <>
                                    <input value={picVal} onChange={e => setPicVal(e.target.value)}
                                      className="border rounded px-1 py-0.5 w-24 text-xs dark:bg-slate-700 dark:border-slate-600"
                                      placeholder="Nama PIC" />
                                    <button onClick={() => { updateSubTask(t.id, { pic: picVal }); setEditingSubsPic(null) }}
                                      className="text-blue-500">â</button>
                                    <button onClick={() => setEditingSubsPic(null)} className="text-slate-400">â</button>
                                  </>
                                ) : (
                                  <button onClick={() => { setEditingSubsPic(t.id); setPicVal(t.pic ?? '') }}
                                    className="text-slate-400 hover:text-blue-500">{t.pic ?? 'Set PIC'}</button>
                                )}
                                <span className={`px-2 py-0.5 rounded-full ${SC[t.status] ?? ''}`}>{SL[t.status] ?? t.status}</span>
                                {t.status !== 'done' && (
                                  <button
                                    onClick={() => updateSubTask(t.id, { status: t.status === 'pending' ? 'in_progress' : 'done' })}
                                    className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full"
                                  >{t.status === 'pending' ? 'Mulai' : 'Selesai'}</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dubbing section */}
            {(item.with_dubb || withDubbEditing || isSupervisor) && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300"
                  onClick={() => {
                    if (!dubbExpanded) { setDubbExpanded(true); if (item.with_dubb) loadDubbTasks() }
                    else setDubbExpanded(false)
                  }}
                >
                  <span className="flex items-center gap-2">
                    Dubbing
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.with_dubb
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>{item.with_dubb ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                  {dubbExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {dubbExpanded && (
                  <div className="px-4 py-3 space-y-3">
                    {isSupervisor && (
                      <div className="flex items-center gap-2">
                        {withDubbEditing ? (
                          <>
                            <button onClick={() => toggleWithDubb(true)}
                             6Æ74æÖSÒ'FWB×2&r×W'ÆRÓSFWB×vFRÓ2Ó&÷VæFVBÖgVÆÂ#ä·Ff¶ãÂö'WGFöãà¢Æ'WGFöâöä6Æ6³×²ÓâFövvÆUvFGV&"fÇ6RÐ¢6Æ74æÖSÒ'FWB×2&r×6ÆFRÓ#F&³¦&r×6ÆFRÓsFWB×6ÆFRÓsF&³§FWB×6ÆFRÓ3Ó2Ó&÷VæFVBÖgVÆÂ#äæöæ·Ff¶ãÂö'WGFöãà¢Æ'WGFöâöä6Æ6³×²Óâ6WEvFGV&$VFFærfÇ6RÒ6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓS#ä&FÃÂö'WGFöãà¢Âóà¢¢¢Æ'WGFöâöä6Æ6³×²Óâ6WEvFGV&$VFFærG'VRÒ6Æ74æÖSÒ'FWB×2FWB×W'ÆRÓS÷fW#§FWB×W'ÆRÓs#à¢V&7FGW2GV&&æp¢Âö'WGFöãà¢Ð¢ÂöFcà¢Ð¢¶FVÒçvFöGV&"bb¢ÆöFætGV&"ò¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"FWB×2FWB×6ÆFRÓS#à¢ÄÆöFW#"6Æ74æÖSÒ'rÓ2Ó2æÖFR×7â"óâÆöFærââà¢ÂöFcà¢¢GV&$FFæÆVæwFÓÓÒò¢Ç6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓC#ä&VÇVÒFGV&&ærF6²ãÂ÷à¢¢¢ÆFb6Æ74æÖSÒ'76R×Ó"#à¢¶GV&$FFæÖC¢çÓâ¢ÆFb¶W×·BæGÒ6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâvÓ"FWB×2#à¢Ç7â6Æ74æÖSÒ'FWB×6ÆFRÓsF&³§FWB×6ÆFRÓ3föçBÖÖVFVÒ#ç·BæÆæwVvWÓÂ÷7ãà¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"#à¢¶VFFætGV&%2ÓÓÒBæBò¢Ãà¢ÆçWBfÇVS×¶GV&%5fÇÒöä6ævS×¶RÓâ6WDGV&%5fÂRçF&vWBçfÇVRÐ¢6Æ74æÖSÒ&&÷&FW"&÷VæFVBÓÓãRrÓ#BFWB×2F&³¦&r×6ÆFRÓsF&³¦&÷&FW"×6ÆFRÓc ¢Æ6VöÆFW#Ò$æÖ2"óà¢Æ'WGFöâöä6Æ6³×²Óâ²WFFTGV&%F6²BæBÂ²3¢GV&%5fÂÒ²6WDVFFætGV&%2çVÆÂ×Ð¢6Æ74æÖSÒ'FWB×W'ÆRÓS#î)É3Âö'WGFöãà¢Æ'WGFöâöä6Æ6³×²Óâ6WDVFFætGV&%2çVÆÂÒ6Æ74æÖSÒ'FWB×6ÆFRÓC#î)ÉSÂö'WGFöãà¢Âóà¢¢¢Æ'WGFöâöä6Æ6³×²Óâ²6WDVFFætGV&%2BæB²6WDGV&%5fÂBç2óòrr×Ð¢6Æ74æÖSÒ'FWB×6ÆFRÓC÷fW#§FWB×W'ÆRÓS#ç·Bç2óòu6WB2wÓÂö'WGFöãà¢Ð¢Ç7â6Æ74æÖS×¶Ó"ÓãR&÷VæFVBÖgVÆÂGµ45·Bç7FGW5ÒóòrwÖÓçµ4Å·Bç7FGW5ÒóòBç7FGW7ÓÂ÷7ãà¢·Bç7FGW2ÓÒvFöæRrbb¢Æ'WGFöà¢öä6Æ6³×²ÓâWFFTGV&%F6²BæBÂ²7FGW3¢Bç7FGW2ÓÓÒwVæFærròvå÷&öw&W72r¢vFöæRrÒÐ¢6Æ74æÖSÒ'FWB×2&r×W'ÆRÓSFWB×vFRÓ"ÓãR&÷VæFVBÖgVÆÂ ¢ç·Bç7FGW2ÓÓÒwVæFærròt×VÆr¢u6VÆW6wÓÂö'WGFöãà¢Ð¢ÂöFcà¢ÂöFcà¢Ð¢ÂöFcà¢¢Ð¢ÂöFcà¢Ð¢ÂöFcà¢Ð ¢²ò¢7Föâ'WGFöç2¢÷Ð¢ÆFb6Æ74æÖSÒ'76R×Ó"#à¢¶FVÒbb5DEU5ôõ$DU"âæFWöbFVÒç7FGW227FGW4VçVÒãÒb`¢5DEU5ôõ$DU"ææFWöbFVÒç7FGW227FGW4VçVÒÂ5DEU5ôõ$DU"æÆVæwFÒb`¢²u2&ö6W72rÂtæVVB&Wf6VBuÒææ6ÇVFW2FVÒç7FGW2b`¢4VFF÷"bb¢Æ'WGFöà¢öä6Æ6³×²ÓâGfæ6U7FGW2Ð¢F6&ÆVC×¶Gfæ6æwÐ¢6Æ74æÖSÒ'rÖgVÆÂÓ"ãR&÷VæFVB×Â&rÖ&ÇVRÓSFWB×vFRFWB×6ÒföçB×6VÖ&öÆBF6&ÆVC¦÷6GÓSfÆWFV×2Ö6VçFW"§W7FgÖ6VçFW"vÓ" ¢à¢¶Gfæ6ærbbÄÆöFW#"6Æ74æÖSÒ'rÓBÓBæÖFR×7â"óçÐ¢¶Gfæ6æròtÖV×&÷6W2âââr¢Ææ§WB(i"Gµ5DEU5ôõ$DU%µ5DEU5ôõ$DU"ææFWöbFVÒç7FGW227FGW4VçVÒ²ÒóòrwÖÐ¢Âö'WGFöãà¢Ð¢¶FVÒç7FGW2ÓÓÒtæVVB&Wf6VBrbb57WW'f6÷"bb¢Æ'WGFöâöä6Æ6³×²Óâ6WE6÷u&Wf6TÖöFÂG'VRÐ¢6Æ74æÖSÒ'rÖgVÆÂÓ"ãR&÷VæFVB×Â&÷&FW"&÷&FW"×&VBÓSFWB×&VBÓSFWB×6ÒföçB×6VÖ&öÆB ¢å&Wf6SÂö'WGFöãà¢Ð¢¶FVÒç7FGW2ÓÓÒtæVVB&Wf6VBrbb&öÆRÓÓÒvVFF÷"rbb¢Æ'WGFöâöä6Æ6³×·&W7V&ÖGÒF6&ÆVC×¶Gfæ6æwÐ¢6Æ74æÖSÒ'rÖgVÆÂÓ"ãR&÷VæFVB×Â&rÖ&ÇVRÓSFWB×vFRFWB×6ÒföçB×6VÖ&öÆBF6&ÆVC¦÷6GÓS ¢ç¶Gfæ6æròtÖV×&÷6W2âââr¢t¶&ÒVÆærwÓÂö'WGFöãà¢Ð¢µ²u2&ö6W72rÂu2FöæRuÒææ6ÇVFW2FVÒç7FGW2bb57WW'f6÷"bb¢Æ'WGFöâöä6Æ6³×²Óâ6WE6÷u&Wf6TÖöFÂG'VRÐ¢6Æ74æÖSÒ'rÖgVÆÂÓ"ãR&÷VæFVB×Â&÷&FW"&÷&FW"Ö÷&ævRÓSFWBÖ÷&ævRÓSFWB×6ÒföçBÖÖVFVÒ ¢ä¶VÖ&Æ¶â¶RÔÂö'WGFöãà¢Ð¢ÂöFcà ¢²ò¢7F÷'¢÷Ð¢ÆFb6Æ74æÖSÒ&&÷&FW"&÷&FW"×6ÆFRÓ#F&³¦&÷&FW"×6ÆFRÓs&÷VæFVB×Â÷fW&fÆ÷rÖFFVâ#à¢Æ'WGFöà¢6Æ74æÖSÒ'rÖgVÆÂfÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâÓBÓ2&r×6ÆFRÓSF&³¦&r×6ÆFRÓFWB×6ÒföçBÖÖVFVÒFWB×6ÆFRÓsF&³§FWB×6ÆFRÓ3 ¢öä6Æ6³×²Óâ6WE6÷t7F÷'6÷t7F÷'Ð¢à¢Ç7ãå&vB7FGW3Â÷7ãà¢·6÷t7F÷'òÄ6Wg&öåW6Æ74æÖSÒ'rÓBÓB"óâ¢Ä6Wg&öäF÷vâ6Æ74æÖSÒ'rÓBÓB"óçÐ¢Âö'WGFöãà¢·6÷t7F÷'bb¢ÆFb6Æ74æÖSÒ'ÓBÓ2#à¢²FVÒæ7F÷'ÇÂFVÒæ7F÷'æÆVæwFÓÓÒò¢Ç6Æ74æÖSÒ'FWB×2FWB×6ÆFRÓC#ä&VÇVÒF&vBãÂ÷à¢¢¢ÆFb6Æ74æÖSÒ'76R×Ó"#à¢¶FVÒæ7F÷'æÖ¢çÂ¢çVÖ&W"Óâ¢ÆFb¶W×¶Ò6Æ74æÖSÒ&fÆWFV×2×7F'BvÓ"FWB×2#à¢ÆFb6Æ74æÖSÒ'rÓãRÓãR&÷VæFVBÖgVÆÂ&rÖ&ÇVRÓC×BÓãR6&æ²Ó"óà¢ÆFcà¢Ç6Æ74æÖSÒ&föçBÖÖVFVÒFWB×6ÆFRÓsF&³§FWB×6ÆFRÓ3#ç¶ç7FGW7ÓÂ÷à¢Ç6Æ74æÖSÒ'FWB×6ÆFRÓC#ç¶æ6ævVEö'óò~(	BwÒ+r¶æ6ævVEöBòæWrFFRæ6ævVEöBçFôÆö6ÆU7G&ærvBÔBr¢~(	BwÓÂ÷à¢ÂöFcà¢ÂöFcà¢Ð¢ÂöFcà¢Ð¢ÂöFcà¢Ð¢ÂöFcà¢ÂöFcà¢Ð¢ÂöFcà ¢·6÷u&Wf6TÖöFÂbb¢Å&Wf6TÖöFÀ¢öä6Æ÷6S×²Óâ6WE6÷u&Wf6TÖöFÂfÇ6RÐ¢öå7V&ÖC×µ²u2&ö6W72rÂu2FöæRuÒææ6ÇVFW2FVÓòç7FGW2óòrrò&WGW&åFôÔ¢æFÆU&Wf6WÐ¢ÆöFæs×·&Wf6æwÐ¢ÖöFS×µ²u2&ö6W72rÂu2FöæRuÒææ6ÇVFW2FVÓOËÝ]\ÈÏÈ	ÉÊHÈ	Ü]\È	Ü]\ÙIßBÏ
_BÜÚÝÔPÑÜH	][H	
PÑÜT[[][O^Ú][_BÛÛÜÙO^Ê
HOÙ]ÚÝÔPÑÜJ[ÙJ_BÛÝXZ]Y^Ê
HOÈ]]]J
NÈÛ\ÝY\Ú

H_BÏ
_BÙ]
BBËÈ8¥ 8¥ XZ[PÓ\ÝYÙH8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ ^ÜY][[Ý[ÛPÓ\ÝYÙJ
HÂÛÛÝÜÙX\ÚÙ]ÙX\ÚHH\ÙTÝ]J	ÉÊBÛÛÝÜÝ]\ËÙ]Ý]\×HH\ÙTÝ]OÝ]\Ñ[[H	ÉÏ	ÉÊBÛÛÝÜ\Ý[Ù]\Ý[HH\ÙTÝ]O	ÔTÔÉÈ	ÓÕTÔÉÈ	ÉÏ	ÉÊBÛÛÝÜÚÝÑ[\Ù]ÚÝÑ[\HH\ÙTÝ]J[ÙJBÛÛÝÜÙ[XÝYYÙ]Ù[XÝYYHH\ÙTÝ]O[X\[[
BÛÛÝÈ\Ù\HH\ÙP]]

BÛÛÝÛHH\Ù\ËÛHÏÈ	ÉÂÛÛÝZ[Ù^HH

HOÂÛÛÝH]ÈTÙX\Ú\[\Ê
BY
ÙX\Ú
HÙ]
	ÜÙX\Ú	ËÙX\Ú
BY
Ý]\ÊHÙ]
	ÜÝ]\ÉËÝ]\ÊBY
\Ý[
HÙ]
	Ü\Ý[	Ë\Ý[
B]\ÜXÏÉÜÔÝ[Ê
_XBÛÛÝÈ]K\ÓØY[ÈHH\ÙTÕÔPÐÛÛ[×OZ[Ù^J
K]Ú\È][Y]SÛØÝ\Î[ÙHJBÛÛÝÛ\ÝY\ÚH

HOÂÛØ[]]]J
Î[JHO\[ÙÈOOH	ÜÝ[ÉÈ	ËÝ\ÕÚ]
	ËÜXÏÉÊJBBÛÛÝ^Ü^Ù[H\Þ[È

HOÂHÂÛÛÝ\ÈH]ØZ]\KÙ]
	ËÜXËÙ^ÜÙ^Ù[	ËÈ\ÜÛÙU\N	ØØÈJBÛÛÝ\HTÜX]SØXÝT
\Ë]JBÛÛÝHHØÝ[Y[ÜX]Q[[Y[
	ØIÊBKYH\ÈKÝÛØYH	ÜX×Û\ÝÞ	ÎÈKÛXÚÊ
BT]ÚÙSØXÝT
\
BHØ]ÚÈ[\
	ÑØYØ[^Ü^Ù[	ÊHBB]\
]Û\ÜÓ[YOHZ[Z\ØÜY[Ë\Û]KML\ÎË\Û]KNMLLÜ\]OHPÈ\ÝÏ]Û\ÜÓ[YOHMKLÈÜXÙK^KLÈ]Û\ÜÓ[YOH^Ø\L]Û\ÜÓ[YOH^LH[]]HÙX\ÚÛ\ÜÓ[YOHXÛÛ]HYLÈÜLKÌ][Û]K^KLKÌËMM^\Û]KMÏ[][YO^ÜÙX\ÚBÛÚ[ÙO^ÙHOÙ]ÙX\Ú
K\Ù][YJ_BXÙZÛ\HØ\HY[Û\ÜÓ[YOHËY[NHLÈKLÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^^\ÛHË]Ú]H\ÎË\Û]KN^\Û]KNL\Î^\Û]KLLØÝ\ÎÝ][K[ÛHØÝ\Î[ËLØÝ\Î[ËXYKMLÏÙ]]ÛÛÛXÚÏ^Ê
HOÙ]ÚÝÑ[\\ÚÝÑ[\_BÛ\ÜÓ[YO^ØLHÝ[Y^Ü\	ÜÚÝÑ[\È	ØÜ\XYKMLËXYKML\ÎËXYKNLÌ^XYKML	È	ØÜ\\Û]KL\ÎÜ\\Û]KMÌ^\Û]KML\Î^\Û]KMË]Ú]H\ÎË\Û]KN	ßXB[\Û\ÜÓ[YOHËMMÏØ]ÛÊÛHOOH	ØYZ[ÈÛHOOH	ØÚYÙY]ÜÊH	
]ÛÛÛXÚÏ^Ù^Ü^Ù[BÛ\ÜÓ[YOHLHÝ[Y^Ü\Ü\\Û]KL\ÎÜ\\Û]KMÌ^\Û]KML\Î^\Û]KMË]Ú]H\ÎË\Û]KNÝÛØYÛ\ÜÓ[YOHËMMÏØ]Û
_BÙ]ÜÚÝÑ[\	
]Û\ÜÓ[YOHË]Ú]H\ÎË\Û]KNÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^LÈÜXÙK^KLÈ]Û\ÜÓ[YOH^^ÈÛ[YY][H^\Û]KML\Î^\Û]KMXLKHÝ]\ÏÜ]Û\ÜÓ[YOH^^]Ü\Ø\LKH]ÛÛÛXÚÏ^Ê
HOÙ]Ý]\Ê	ÉÊ_BÛ\ÜÓ[YO^Ø^^ÈLÈKLHÝ[YY[	ÜÝ]\ÈOOH	ÉÈÈ	ØËXYKML^]Ú]IÈ	ØË\Û]KLL\ÎË\Û]KMÌ^\Û]KM\Î^\Û]KLÌ	ßXBÙ[]XOØ]ÛÔÕUTÑTËX\
ÈO
]ÛÙ^O^ÜßHÛÛXÚÏ^Ê
HOÙ]Ý]\ÊÊ_BÛ\ÜÓ[YO^Ø^^ÈLÈKLHÝ[YY[	ÜÝ]\ÈOOHÈÈ	ØËXYKML^]Ú]IÈ	ØË\Û]KLL\ÎË\Û]KMÌ^\Û]KM\Î^\Û]KLÌ	ßXBÜßOØ]Û
J_BÙ]Ù]]Û\ÜÓ[YOH^^ÈÛ[YY][H^\Û]KML\Î^\Û]KMXLKHPÈ\Ý[Ü]Û\ÜÓ[YOH^Ø\LKHÊÖÉÉË	ÔÙ[]XI×KÉÔTÔÉË	ÔTÔÉ×KÉÓÕTÔÉË	ÓÕTÔÉ×WH\ÈÛÛÝ
KX\

ÝX[JHO
]ÛÙ^O^ÝHÛÛXÚÏ^Ê
HOÙ]\Ý[
\È	ÔTÔÉÈ	ÓÕTÔÉÈ	ÉÊ_BÛ\ÜÓ[YO^Ø^^ÈLÈKLHÝ[YY[	Ü\Ý[OOHÈ	ØËXYKML^]Ú]IÈ	ØË\Û]KLL\ÎË\Û]KMÌ^\Û]KM\Î^\Û]KLÌ	ßXBÛX[OØ]Û
J_BÙ]Ù]]ÛÛÛXÚÏ^Ê
HOÈÙ]Ý]\Ê	ÉÊNÈÙ]\Ý[
	ÉÊNÈÙ]ÙX\Ú
	ÉÊNÈÙ]ÚÝÑ[\[ÙJH_BÛ\ÜÓ[YOH^^È^\YMLÝ\^\YMÌ\Ù][\Ø]ÛÙ]
_BÚ\ÓØY[ÈÈ
]Û\ÜÓ[YOH^][\ËXÙ[\\ÝYKXÙ[\KLLØY\Û\ÜÓ[YOHËMM[[X]K\Ü[^XYKMLÏÙ]
HY]H]K[ÝOOHÈ
]Û\ÜÓ[YOH^XÙ[\KLL\Ú]HÛ\ÜÓ[YOHËLLLL^X]]È^\Û]KLÌ\Î^\Û]KMXLÏÛ\ÜÓ[YOH^\ÛH^\Û]KMYZÈYH]KÜÙ]
H
]Û\ÜÓ[YOHÜXÙK^KLÙ]KX\
][HO
]ÛÙ^O^Ú][KYBÛÛXÚÏ^Ê
HOÙ]Ù[XÝYY
][KY
_BÛ\ÜÓ[YOHËY[^[YË]Ú]H\ÎË\Û]KNÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^MKLÈÝ\Ü\XYKM\ÎÝ\Ü\XYKML[Ú][ÛXÛÛÜÈ]Û\ÜÓ[YOH^][\Ë\Ý\\ÝYKX]ÙY[Ø\L]Û\ÜÓ[YOHZ[]ËL^LHÛ\ÜÓ[YOH^^ÈÛ[[ÛÈ^\Û]KM\Î^\Û]KMLÚ][KXÚYÏÈ	ø %	ßOÜÛ\ÜÓ[YOHÛ[YY][H^\Û]KNL\Î^\Û]KLL[Ø]HÚ][K]_OÜÚ][KÙX\ÛÛ	
Û\ÜÓ[YOH^^È^\Û]KML\Î^\Û]KMÞÚ][KÙX\ÛÛH^Ú][K\\ÛÙ_OÜ
_BÙ]]Û\ÜÓ[YOHÚ[ËL^^XÛÛ][\ËY[Ø\LHÝ]\ÐYÙHÝ]\Ï^Ú][KÝ]\ßHÏÚ][KX×Ü\Ý[	
Ü[Û\ÜÓ[YO^Ø^^ÈÛ\Ù[ZXÛLKLHÝ[YY[	Â][KX×Ü\Ý[OOH	ÔTÔÉÈÈ	ØËYÜY[LL^YÜY[MÌ\ÎËYÜY[NLÌÌ\Î^YÜY[M	Â][KX×Ü\Ý[OOH	ÑRS	ÈÈ	ØË\YLL^\YMÌ\ÎË\YNLÌÌ\Î^\YM	Â	ØË^Y[ÝËLL^^Y[ÝËMÌ\ÎË^Y[ÝËNLÌÌ\Î^^Y[ÝËM	ÂXOÚ][KX×Ü\Ý[OÜÜ[
_BÙ]Ù]Ú][KX×ÙY]ÜÛ[YH	
Û\ÜÓ[YOH^^È^\Û]KM\Î^\Û]KML]LHÚ][KX×ÙY]ÜÛ[Y_OÜ
_BØ]Û
J_BÙ]
_BÙ]ÝÛS]ÏÜÙ[XÝYYOOH[	
PÑ]Z[[[Y^ÜÙ[XÝYYBÛÛÜÙO^Ê
HOÙ]Ù[XÝYY
[
_BÛ\ÝY\Ú^ÛÛ\ÝY\ÚBÏ
_BÙ]
BB
