import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { ClinicalDocument } from "@/components/domain/clinical/types";
import { DocumentsSection } from "./documents-section";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderSection(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof DocumentsSection> = { patientId: "pat-1", practitionerName: "Dr. Benali" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <DocumentsSection {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

const ANALYSIS_DOC: ClinicalDocument = {
  id: "doc-a",
  patientId: "pat-1",
  category: "analysis",
  title: "Résultats biologiques",
  fileName: "resultats.pdf",
  mimeType: "application/pdf",
  sizeBytes: 456_000,
  uploadedAt: "2026-08-23",
  uploadedBy: "Dr. Benali",
};

const IMAGING_DOC: ClinicalDocument = {
  id: "doc-b",
  patientId: "pat-1",
  category: "imaging",
  title: "Radiographie genou",
  fileName: "radiographie-genou.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 1_258_291,
  uploadedAt: "2026-08-18",
  uploadedBy: "Dr. Benali",
  description: "Cliché de contrôle.",
};

const FULL_DOCUMENTS = [ANALYSIS_DOC, IMAGING_DOC];

describe("DocumentsSection", () => {
  it("renders the Documents heading (1)", () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("renders the document list with metadata (2/3)", () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    expect(screen.getByText("Résultats biologiques")).toBeInTheDocument();
    expect(screen.getByText("Radiographie genou")).toBeInTheDocument();
    const analysisRow = screen.getByText("Résultats biologiques").closest("li")!;
    expect(within(analysisRow).getByText(/Analyse/)).toBeInTheDocument();
    const imagingRow = screen.getByText("Radiographie genou").closest("li")!;
    expect(within(imagingRow).getByText(/Imagerie/)).toBeInTheDocument();
    expect(within(imagingRow).getByText(/1,2 MB/)).toBeInTheDocument();
  });

  it("filters by category (4)", () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    fireEvent.click(screen.getByRole("button", { name: "Imagerie" }));
    expect(screen.getByText("Radiographie genou")).toBeInTheDocument();
    expect(screen.queryByText("Résultats biologiques")).not.toBeInTheDocument();
  });

  it("shows the filtered-empty message for a category with nothing (and the result count)", () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: [ANALYSIS_DOC] });
    expect(screen.getByText("1 documents")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Comptes-rendus" }));
    expect(screen.getByText("Aucun document ne correspond à ce filtre.")).toBeInTheDocument();
  });

  it("opens the document detail drawer with full metadata (5)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    const row = screen.getByText("Radiographie genou").closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "Radiographie genou" });
    expect(within(dialog).getByText("Catégorie")).toBeInTheDocument();
    expect(within(dialog).getByText("Imagerie")).toBeInTheDocument();
    expect(within(dialog).getByText("Ajouté le")).toBeInTheDocument();
    expect(within(dialog).getByText("Ajouté par")).toBeInTheDocument();
    expect(within(dialog).getByText("Dr. Benali")).toBeInTheDocument();
    expect(within(dialog).getByText("Fichier")).toBeInTheDocument();
    expect(within(dialog).getByText("radiographie-genou.jpg")).toBeInTheDocument();
    expect(within(dialog).getByText("Taille")).toBeInTheDocument();
    expect(within(dialog).getByText("Description")).toBeInTheDocument();
    expect(within(dialog).getByText("Cliché de contrôle.")).toBeInTheDocument();
  });

  it("download is a future-feature notice only, never a real download (6)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    const row = screen.getByText("Radiographie genou").closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "Radiographie genou" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Télécharger" }));
    expect(
      screen.getByText("Le téléchargement sécurisé sera connecté au stockage documentaire ultérieurement."),
    ).toBeInTheDocument();
  });

  it("opens the add-document form (7)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un document" }));
    const dialog = await screen.findByRole("dialog", { name: "Ajouter un document" });
    expect(dialog).toBeInTheDocument();
  });

  it("requires a file before submit (8)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un document" }));
    const dialog = await screen.findByRole("dialog", { name: "Ajouter un document" });
    fireEvent.change(within(dialog).getByLabelText("Titre *"), { target: { value: "Nouveau document" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Ajouter" }));
    expect(within(dialog).getByText("Veuillez sélectionner un fichier.")).toBeInTheDocument();
  });

  it("rejects a disallowed MIME type (9)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un document" }));
    const dialog = await screen.findByRole("dialog", { name: "Ajouter un document" });
    const file = new File(["x"], "malware.exe", { type: "application/x-msdownload" });
    fireEvent.change(within(dialog).getByLabelText("Fichier *"), { target: { files: [file] } });
    fireEvent.change(within(dialog).getByLabelText("Titre *"), { target: { value: "Fichier suspect" } });
    fireEvent.change(within(dialog).getByLabelText("Catégorie *"), { target: { value: "other" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Ajouter" }));
    expect(
      within(dialog).getByText("Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG."),
    ).toBeInTheDocument();
  });

  it("succeeds with valid metadata-only upload and the new document appears (10/11)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un document" }));
    const dialog = await screen.findByRole("dialog", { name: "Ajouter un document" });
    const file = new File(["x"], "nouveau-scan.pdf", { type: "application/pdf" });
    fireEvent.change(within(dialog).getByLabelText("Fichier *"), { target: { files: [file] } });
    fireEvent.change(within(dialog).getByLabelText("Catégorie *"), { target: { value: "report" } });
    fireEvent.change(within(dialog).getByLabelText("Titre *"), { target: { value: "Nouveau compte-rendu" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Ajouter" }));

    expect(screen.queryByRole("dialog", { name: "Ajouter un document" })).not.toBeInTheDocument();
    expect(screen.getByText("Document ajouté.")).toBeInTheDocument();
    expect(screen.getByText("Nouveau compte-rendu")).toBeInTheDocument();
  });

  it("never exposes a delete action anywhere (12)", async () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    expect(screen.queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
    const row = screen.getByText("Radiographie genou").closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "Radiographie genou" });
    expect(within(dialog).queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
  });

  it("shows the empty-documents state (13)", () => {
    renderSection("fr", { patientId: "pat-2", practitionerName: "Dr. Benali", documents: [] });
    expect(screen.getByText("Aucun document clinique.")).toBeInTheDocument();
    expect(screen.getByText("Les documents médicaux du patient apparaîtront ici.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter un document" })).toBeInTheDocument();
  });

  it("shows no finance content (34)", () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    expect(screen.queryByText(/Facturé/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Solde/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bMAD\b/)).not.toBeInTheDocument();
  });

  it("renders French content by default (38)", () => {
    renderSection("fr", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (39/40)", () => {
    const { container } = renderSection("ar", { patientId: "pat-1", practitionerName: "Dr. Benali", documents: FULL_DOCUMENTS });
    expect(screen.getByText("المستندات")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "عرض" }).length).toBeGreaterThan(0);
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});
