export default function HistoryPage({ params }: { params: { date: string } }) {
  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px]">
      <div className="w-full max-w-md">
        <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-8">Workout History</h1>
        <p className="text-[20px] leading-[120%] text-[#000000]">Date: {params.date}</p>
        <p className="text-[16px] leading-[120%] text-[rgba(0,0,0,0.5)] mt-4">
          (This is a placeholder page for workout history)
        </p>
      </div>
    </div>
  )
}
