const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export function getFilterOptions(computers) {
  return {
    ram: [...new Set(computers.map((computer) => computer.ramGb).filter((ram) => Number.isFinite(ram) && ram > 0))].sort((a, b) => a - b),
    gpus: [...new Set(computers.map((computer) => computer.gpu).filter(isNonEmptyString))].sort((a, b) => a.localeCompare(b, "es")),
    processors: [...new Set(computers.map((computer) => computer.processor).filter(isNonEmptyString))].sort((a, b) => a.localeCompare(b, "es")),
  };
}

export function filterComputers(computers, filters) {
  const query = (filters.search ?? "").trim().toLocaleLowerCase("es");
  const minRam = filters.minRam ? Number(filters.minRam) : 0;

  return computers.filter((computer) => {
    const text = [computer.name, computer.gpu, computer.processor].join(" ").toLocaleLowerCase("es");

    return (
      (!query || text.includes(query)) &&
      (!minRam || computer.ramGb >= minRam) &&
      (!filters.gpu || computer.gpu === filters.gpu) &&
      (!filters.processor || computer.processor === filters.processor)
    );
  });
}
