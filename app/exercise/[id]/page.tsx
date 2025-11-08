export default function ExercisePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-[10px]">
      <div className="w-full max-w-md">
        <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-8">Exercise Details</h1>
        <p className="text-[20px] leading-[120%] text-[#000000]">Exercise ID: {params.id}</p>
        <p className="text-[16px] leading-[120%] text-[rgba(0,0,0,0.5)] mt-4">
          (This is a placeholder page for exercise details and history)
        </p>
      </div>
    </div>
  )
}
