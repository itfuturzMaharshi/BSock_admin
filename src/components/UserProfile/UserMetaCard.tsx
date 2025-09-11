interface UserMetaCardProps {
  name: string;
}

export default function UserMetaCard({ name }: UserMetaCardProps) {
  return (
    <div className="p-5 border bg-white border-gray-200 rounded-2xl shadow dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 flex items-center justify-center border border-gray-200 rounded-full dark:border-gray-800 bg-gray-100 dark:bg-gray-700">
            <i className="fas fa-user text-gray-600 dark:text-gray-300 text-3xl"></i>
          </div>
          <div>
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {name}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
