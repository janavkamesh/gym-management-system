import re

with open('components/ActivityLogsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { Filter, X, Search, RotateCcw, ArrowLeft } from 'lucide-react';", "import { Filter, X, Search, RotateCcw, ArrowLeft } from 'lucide-react';\nimport { useRouter } from 'next/navigation';")

header_old = '''      <div className="flex lg:hidden justify-between items-center mb-6 mt-4">
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Activity Logs</h1>'''
header_new = '''      <div className="flex lg:hidden justify-between items-center mb-6 mt-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Activity Logs</h1>'''
content = content.replace(header_old, header_new)

content = content.replace("export default function ActivityLogsClient({ initialData, initialHasMore, initialError }: any) {", "export default function ActivityLogsClient({ initialData, initialHasMore, initialError }: any) {\n  const router = useRouter();")

with open('components/ActivityLogsClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
