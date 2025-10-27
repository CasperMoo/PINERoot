function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Tailwind CSS 配置测试
        </h1>
        <p className="text-gray-600 mb-6">
          如果你看到这个页面有渐变背景、圆角卡片和漂亮的阴影，说明 Tailwind CSS 配置成功！
        </p>
        <div className="space-y-3">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200">
            主按钮
          </button>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-200">
            成功按钮
          </button>
          <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-200">
            危险按钮
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
