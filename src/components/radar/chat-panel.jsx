"use client"

import { useRadarStore } from "@/stores/radar-store"
import { cn } from "@/lib/utils"
import {
	Loader2,
	MessageSquareText,
	Send,
	Sparkles,
	Trash2,
	X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"

function formatTime(ts) {
	if (!ts) return ""
	const sec = ts._seconds ?? ts.seconds
	const d = sec ? new Date(sec * 1000) : new Date(ts)
	if (Number.isNaN(d.getTime())) return ""
	return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function TypingIndicator() {
	return (
		<div className="flex items-center gap-1 px-1 py-2">
			<span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
			<span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
			<span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
		</div>
	)
}

function ChatMessage({ message }) {
	const isUser = message.role === "user"

	return (
		<div
			className={cn(
				"flex w-full",
				isUser ? "justify-end" : "justify-start"
			)}
		>
			<div
				className={cn(
					"max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
					isUser
						? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
						: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
				)}
			>
				{isUser ? (
					<p className="whitespace-pre-wrap">{message.content}</p>
				) : (
					<div className="prose prose-sm prose-zinc dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-2 first:prose-headings:mt-0 prose-p:text-[13px] prose-li:text-[13px] max-w-none">
						<Markdown>{message.content}</Markdown>
					</div>
				)}
				{message.createdAt && (
					<p
						className={cn(
							"mt-1 text-[10px]",
							isUser
								? "text-zinc-400"
								: "text-zinc-400 dark:text-zinc-500"
						)}
					>
						{formatTime(message.createdAt)}
					</p>
				)}
			</div>
		</div>
	)
}

function SuggestionChips({ suggestions, onSelect, disabled }) {
	if (!suggestions.length) return null

	return (
		<div className="flex flex-wrap gap-1.5 px-4 pb-2">
			{suggestions.map(s => (
				<button
					key={s}
					type="button"
					disabled={disabled}
					onClick={() => onSelect(s)}
					className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
				>
					{s}
				</button>
			))}
		</div>
	)
}

export function ChatPanel() {
	const {
		chatOpen,
		toggleChat,
		closeChat,
		chatMessages,
		chatLoading,
		chatSuggestions,
		sendChat,
		clearChat,
		fetchChatHistory,
		fetchChatSuggestions,
		selectedProjectId,
		projects,
	} = useRadarStore()

	const [input, setInput] = useState("")
	const scrollRef = useRef(null)
	const inputRef = useRef(null)
	const didLoad = useRef(null)

	const project = projects.find(p => p.id === selectedProjectId)

	useEffect(() => {
		if (
			chatOpen &&
			selectedProjectId &&
			didLoad.current !== selectedProjectId
		) {
			didLoad.current = selectedProjectId
			fetchChatHistory()
			fetchChatSuggestions()
		}
	}, [chatOpen, selectedProjectId, fetchChatHistory, fetchChatSuggestions])

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [chatMessages, chatLoading])

	useEffect(() => {
		if (chatOpen) setTimeout(() => inputRef.current?.focus(), 100)
	}, [chatOpen])

	const handleSend = useCallback(() => {
		const msg = input.trim()
		if (!msg || chatLoading) return
		setInput("")
		sendChat(msg)
	}, [input, chatLoading, sendChat])

	const handleSuggestion = useCallback(
		text => {
			if (chatLoading) return
			sendChat(text)
		},
		[chatLoading, sendChat]
	)

	return (
		<>
			{/* Floating trigger button */}
			<button
				type="button"
				onClick={toggleChat}
				className={cn(
					"fixed right-5 bottom-5 z-50 flex size-11 items-center justify-center rounded-full shadow-lg ring-1 ring-black/5 transition-all duration-200 hover:scale-105 active:scale-95",
					chatOpen
						? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
						: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
				)}
				title="Project Intelligence Chat"
			>
				{chatOpen ? (
					<X className="size-4" />
				) : (
					<Sparkles className="size-4" />
				)}
			</button>

			{/* Chat popup dialog */}
			<div
				className={cn(
					"fixed right-5 bottom-20 z-40 flex w-[380px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-950/10 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30",
					chatOpen
						? "pointer-events-auto scale-100 opacity-100"
						: "pointer-events-none scale-95 opacity-0"
				)}
				style={{ height: "min(540px, calc(100dvh - 120px))" }}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
					<div className="flex items-center gap-2.5">
						<div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
							<Sparkles className="size-3 text-white dark:text-zinc-900" />
						</div>
						<div>
							<p className="text-[13px] leading-tight font-semibold text-zinc-900 dark:text-zinc-50">
								{project?.name || "Project"} AI
							</p>
							<p className="text-[10px] leading-tight text-zinc-400">
								Intelligence Copilot
							</p>
						</div>
					</div>
					<div className="flex items-center gap-0.5">
						<button
							type="button"
							onClick={clearChat}
							title="Clear chat"
							className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
						>
							<Trash2 className="size-3.5" />
						</button>
						<button
							type="button"
							onClick={closeChat}
							className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
						>
							<X className="size-3.5" />
						</button>
					</div>
				</div>

				{/* Messages */}
				<div
					ref={scrollRef}
					className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3"
				>
					{chatMessages.length === 0 && !chatLoading && (
						<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
							<div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
								<MessageSquareText className="size-4 text-zinc-400" />
							</div>
							<p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
								Ask me anything
							</p>
							<p className="text-[11px] text-zinc-400">
								about your project intelligence
							</p>
						</div>
					)}

					{chatMessages.map((msg, i) => (
						<ChatMessage
							key={msg.id || `${msg.role}-${i}`}
							message={msg}
						/>
					))}

					{chatLoading && (
						<div className="flex justify-start">
							<div className="rounded-2xl bg-zinc-100 px-3.5 py-1 dark:bg-zinc-800">
								<TypingIndicator />
							</div>
						</div>
					)}
				</div>

				{/* Suggestions */}
				{chatMessages.length === 0 && (
					<SuggestionChips
						suggestions={chatSuggestions}
						onSelect={handleSuggestion}
						disabled={chatLoading}
					/>
				)}

				{/* Input */}
				<div className="border-t border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
					<div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-1 dark:bg-zinc-900">
						<input
							ref={inputRef}
							type="text"
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={e => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault()
									handleSend()
								}
							}}
							placeholder="Ask about your project…"
							disabled={chatLoading}
							className="h-8 flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50 dark:text-zinc-100"
						/>
						<button
							type="button"
							onClick={handleSend}
							disabled={!input.trim() || chatLoading}
							className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
						>
							{chatLoading ? (
								<Loader2 className="size-3 animate-spin" />
							) : (
								<Send className="size-3" />
							)}
						</button>
					</div>
				</div>
			</div>
		</>
	)
}
