import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { 
  getExerciseById, 
  getExerciseRecord,
  getExerciseRecordHistory,
  isExerciseFavorite
} from '@/lib/supabase/queries'
import { ExerciseDetailClient } from './ExerciseDetailClient'

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  // Await params first (Next.js 15 requirement)
  const { id } = await params
  
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex justify-center items-center p-[10px]">
        <div className="w-full max-w-md text-center">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-4">exercise details</h1>
          <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-8 lowercase">
            please log in to view exercise details
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-[#000000] text-[#ffffff] rounded-[20px] text-[20px] leading-[120%] font-normal hover:bg-[rgba(0,0,0,0.8)] transition-colors lowercase"
          >
            log in
          </Link>
        </div>
      </div>
    )
  }
  
  try {
    // Fetch exercise data
    const exercise = await getExerciseById(id)
    
    if (!exercise) {
      return (
        <div className="min-h-screen bg-[#ffffff] flex justify-center items-center p-[10px]">
          <div className="w-full max-w-md text-center">
            <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-4">not found</h1>
            <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-8 lowercase">
              exercise not found
            </p>
            <Link
              href="/exercise"
              className="inline-block px-8 py-4 bg-[#000000] text-[#ffffff] rounded-[20px] text-[20px] leading-[120%] font-normal hover:bg-[rgba(0,0,0,0.8)] transition-colors lowercase"
            >
              back to exercises
            </Link>
          </div>
        </div>
      )
    }
    
    // Fetch user's records and history for this exercise
    const [record, history, isFavorite] = await Promise.all([
      getExerciseRecord(user.id, id),
      getExerciseRecordHistory(user.id, id, 50),
      isExerciseFavorite(user.id, id)
    ])
    
    return (
      <div className="min-h-screen bg-[#ffffff]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#ffffff] border-b border-[rgba(0,0,0,0.1)]">
          <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
            <Link
              href="/exercise"
              className="flex items-center gap-2 px-4 py-3 bg-[#f7f7f7] text-[#000000] rounded-[16px] text-[16px] leading-[120%] hover:bg-[rgba(0,0,0,0.1)] transition-colors lowercase"
            >
              <ArrowLeft className="w-4 h-4" />
              back
            </Link>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <ExerciseDetailClient
            exercise={exercise}
            record={record}
            history={history}
            isFavorite={isFavorite}
            userId={user.id}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading exercise:', error)
    return (
      <div className="min-h-screen bg-[#ffffff] flex justify-center items-center p-[10px]">
        <div className="w-full max-w-md text-center">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-4">error</h1>
          <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-8 lowercase">
            failed to load exercise. please try again.
          </p>
          <Link
            href="/exercise"
            className="inline-block px-8 py-4 bg-[#000000] text-[#ffffff] rounded-[20px] text-[20px] leading-[120%] font-normal hover:bg-[rgba(0,0,0,0.8)] transition-colors lowercase"
          >
            back to exercises
          </Link>
        </div>
      </div>
    )
  }
}
