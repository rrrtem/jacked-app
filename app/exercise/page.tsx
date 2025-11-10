import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllExercises, getFavoriteExerciseIds } from '@/lib/supabase/queries'
import { ExercisesListClient } from './ExercisesListClient'

export default async function ExercisesPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex justify-center items-center p-[10px]">
        <div className="w-full max-w-md text-center">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-4">exercises</h1>
          <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-8 lowercase">
            please log in to view exercises
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
    // Fetch exercises and favorites
    const exercises = await getAllExercises()
    const favoriteIds = await getFavoriteExerciseIds(user.id)
    
    // Map exercises with favorite status
    const exercisesWithFavorites = exercises.map(ex => ({
      ...ex,
      is_favorite: favoriteIds.includes(ex.id),
    }))
    
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <div className="w-full mx-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#ffffff] border-b border-[rgba(0,0,0,0.1)]">
            <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
              <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] lowercase">
                exercises
              </h1>
              <Link
                href="/"
                className="px-6 py-3 bg-[#f7f7f7] text-[#000000] rounded-[16px] text-[16px] leading-[120%] hover:bg-[rgba(0,0,0,0.1)] transition-colors lowercase"
              >
                back to home
              </Link>
            </div>
          </div>
          
          {/* Client component with exercises list */}
          <ExercisesListClient 
            exercises={exercisesWithFavorites} 
            userId={user.id}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading exercises:', error)
    return (
      <div className="min-h-screen bg-[#ffffff] flex justify-center items-center p-[10px]">
        <div className="w-full max-w-md text-center">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-4">error</h1>
          <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] lowercase">
            failed to load exercises. please try again.
          </p>
        </div>
      </div>
    )
  }
}

