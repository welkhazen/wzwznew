                    onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => submitVote(secondaryOption.id)}
                  className={cn(
                    "group relative min-h-[4.8rem] overflow-hidden px-3 py-3 text-center font-display text-lg tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/70 disabled:cursor-not-allowed",
                    secondarySelected ? "text-black" : "text-[#d9d9d9] hover:border-raw-gold/50 hover:text-white",
                    !secondarySelected && isAnswered && "text-raw-silver/72"
                  )}
                  style={{
                    clipPath: BUTTON_CLIP,
                    background: secondarySelected
                      ? "linear-gradient(160deg, #ececec, #9b9b9b)"
                      : "linear-gradient(145deg, rgba(235,235,235,0.08), rgba(12,12,12,0.92))",
                    border: "1px solid rgba(217,217,217,0.34)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <span className="relative flex flex-col items-center justify-center gap-1">
                    {isAnswered && <span className="text-xl font-semibold leading-none">{secondaryPercent}%</span>}
                    <span>{secondaryOption.label}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
