# Healthcare Practice Management SaaS

## Specification 09 --- Detailed Screen & Wireframe Specification

**Product:** Moroccan bilingual FR/AR Healthcare Practice Management
SaaS\
**Frontend:** Next.js + React + TypeScript\
**Primary UX:** Desktop operational application with responsive
tablet/mobile behavior\
**Purpose:** Define the composition, hierarchy, primary actions,
contextual surfaces and responsive behavior of the major V1 screens
before Claude Code begins frontend implementation.

------------------------------------------------------------------------

# 1. Wireframe conventions

These are structural wireframes, not final visual mockups. Boxes are
drawn with plain ASCII (`+`, `-`, `|`) so the specification renders
identically in any editor/encoding; exact borders/spacing are not
prescriptive.

Symbols:

``` text
[Button]          Primary/secondary action
[________]        Input
▼                 Select/combobox
✓ / ○ / ✗         Status/progress representation
⋮                 Secondary action menu
→                 Navigation
```

Every screen must ultimately use Specification #8 components and tokens.

------------------------------------------------------------------------

# 2. Global authenticated shell

Desktop:

``` text
+----------------------+-------------------------------------------------------------+
| PRACTICE / LOGO       | Search...                  + Create   🔔  FR/AR   User      |
|                       +---------------------------------------------------------------+
| Aujourd'hui           |                                                               |
| Agenda                |                 PAGE CONTENT                                  |
| Patients              |                                                               |
|                       |                                                               |
| Finance               |                                                               |
| Équipe                |                                                               |
| Stock                 |                                                               |
|                       |                                                               |
| Communication         |                                                               |
| Rapports              |                                                               |
|                       |                                                               |
| Paramètres            |                                                               |
| Abonnement            |                                                               |
|                       |                                                               |
| Dr. Benali            |                                                               |
+-----------------------+---------------------------------------------------------------+
```

Sidebar adapts to permissions, specialty and enabled features.

------------------------------------------------------------------------

# 3. Mobile shell

Recommended primary mobile navigation:

``` text
+-----------------------------------+
| Page title        Search   User   |
+-----------------------------------+
|                                   |
|          PAGE CONTENT             |
|                                   |
+-----------------------------------+
| Aujourd.  Agenda  Patients  Plus  |
+-----------------------------------+
```

`Plus` opens Finance, Équipe, Stock, Communication, Rapports, Paramètres
and Abonnement according to access.

------------------------------------------------------------------------

# 4. Screen 01 --- Login

``` text
              [Product Logo]

        Connexion à votre espace

Email
[____________________________]

Mot de passe
[____________________________]  👁

[ ] Se souvenir de moi

[ SE CONNECTER ]

Mot de passe oublié ?

                 FR | العربية
```

States:

-   Invalid credentials inline/general alert.
-   Locked/disabled user.
-   Blackout still permits authentication then routes to subscription
    screen.

Mobile: centered single-column form.

------------------------------------------------------------------------

# 5. Screen 02 --- Registration

``` text
Créer votre espace

Prénom
[____________]

Nom
[____________]

Email
[________________________]

Téléphone
[________________________]

Mot de passe
[________________________]

Code de parrainage (optionnel)
[________________________]

[ ] J'accepte les conditions...

[ CRÉER MON COMPTE ]

Déjà inscrit ? Se connecter
```

After successful account creation → onboarding.

------------------------------------------------------------------------

# 6. Screen 03 --- Onboarding: specialty

``` text
Étape 1 sur 5

Quelle est votre activité ?

+--------------------+ +--------------------+
| Dentiste           | | Kinésithérapeute    |
+--------------------+ +--------------------+

+--------------------+ +--------------------+
| Médecin            | | Psychologue         |
+--------------------+ +--------------------+

+--------------------+ +--------------------+
| Nutritionniste     | | Dermatologie /       |
|                    | | Esthétique           |
+--------------------+ +--------------------+

[ Autre ]

                                      [CONTINUER]
```

Selected specialty seeds suggestions; it does not permanently restrict
product.

------------------------------------------------------------------------

# 7. Screen 04 --- Onboarding: cabinet

Fields:

``` text
Nom du cabinet / activité
Nom affiché du praticien
Téléphone
Ville
Adresse (optional)
Logo (optional)
Langue principale
```

Keep secondary details optional.

------------------------------------------------------------------------

# 8. Screen 05 --- Onboarding: working hours

``` text
Vos horaires

Lundi       [08:30] - [18:00]   ✓
Mardi       [08:30] - [18:00]   ✓
Mercredi    [08:30] - [18:00]   ✓
Jeudi       [08:30] - [18:00]   ✓
Vendredi    [08:30] - [18:00]   ✓
Samedi      [09:00] - [13:00]   ✓
Dimanche                         ✗ Fermé

+ Ajouter une pause

[RETOUR]                           [CONTINUER]
```

------------------------------------------------------------------------

# 9. Screen 06 --- Onboarding: services

``` text
Vos services et tarifs

[ Rechercher un service... ]

Suggestions
+ Consultation
+ Contrôle
+ Détartrage
...

SERVICES SÉLECTIONNÉS

Consultation
Prix        [400] MAD
Durée       [30 min ▼]
RDV         [Heure fixe ▼]

Contrôle
Prix        [250] MAD
Durée       [20 min ▼]
RDV         [Heure fixe ▼]

+ Ajouter un service personnalisé

[RETOUR]                           [CONTINUER]
```

------------------------------------------------------------------------

# 10. Screen 07 --- Onboarding complete

``` text
✓ Votre espace est prêt

Vous pouvez commencer immédiatement.

[ CRÉER MON PREMIER PATIENT ]

[ Créer un rendez-vous ]

[ Partager mon lien de réservation ]

                         [Accéder à Aujourd'hui]
```

------------------------------------------------------------------------

# 11. Screen 08 --- Aujourd'hui

Desktop composition:

``` text
Aujourd'hui                                      Samedi 23 août
Bonjour Dr. Benali

+--------------+ +--------------+ +--------------+ +--------------+
| 8 RDV        | | 6 Confirmés  | | 1 À confirm. | | 1 Absent     |
+--------------+ +--------------+ +--------------+ +--------------+

PROCHAIN RENDEZ-VOUS
+-------------------------------------------------------------------+
| 10:30  Ahmed El Mansouri     Consultation                         |
|        Confirmé                              [Ouvrir] [Arrivé]    |
+-------------------------------------------------------------------+

+-------------------------------------+--------------------------+
| AGENDA DU JOUR                      | À FAIRE                  |
|                                      |                          |
| 09:00 Fatima       Terminé          | 3 RDV à confirmer        |
| 09:30 Youssef      Terminé          | 2 échéances en retard    |
| 10:00 Sara         En consultation  | 1 patient à rappeler     |
| 10:30 Ahmed        Confirmé         | 2 stocks faibles         |
| 11:00 Karim        Confirmé         |                          |
|                                      |                          |
| [Voir l'agenda]                     |                          |
+--------------------------------------+--------------------------+

FINANCES AUJOURD'HUI
+---------------+ +---------------+ +---------------+ +---------------+
| Encaissé      | | À encaisser   | | Décaissement  | | Caisse        |
| 2 400 MAD     | | 800 MAD       | | 350 MAD       | | 3 050 MAD     |
+---------------+ +---------------+ +---------------+ +---------------+
```

On mobile, cards become 2-column/stacked and agenda becomes
chronological list.

------------------------------------------------------------------------

# 12. Screen 09 --- Agenda day

``` text
Agenda                                      [+ Nouveau RDV]

[<] [Aujourd'hui] [>]        [Jour] [Semaine]   Praticien [Tous ▼]

        08:00 |
        08:30 |
        09:00 | +-----------------------------------------+
              | | Ahmed · Consultation · Confirmé          |
        09:30 | +-----------------------------------------+
        10:00 | +-----------------------------------------+
              | | Sara · Contrôle · En consultation        |
        10:30 | +-----------------------------------------+
        11:00 | +-----------------------------------------+
              | | Youssef · Arrivée 11:00-11:30            |
              | +-----------------------------------------+
```

Click appointment → Appointment Drawer.

Click empty slot → Create Appointment.

------------------------------------------------------------------------

# 13. Screen 10 --- Agenda week

Columns per day, time vertically.

On smaller screens switch to day/list rather than squeezing seven
columns.

Persistent controls:

-   Previous/next.
-   Today.
-   Day/week.
-   Practitioner.

------------------------------------------------------------------------

# 14. Screen 11 --- Appointment drawer

``` text
                                      +--------------------------------+
                                      | Ahmed El Mansouri               |
                                      | PAT-00281                       |
                                      | 06 XX XX XX XX                  |
                                      |                                  |
                                      | Samedi 23 août                  |
                                      | 10:30                            |
                                      | Consultation                     |
                                      | Dr. Benali                       |
                                      |                                  |
                                      | [CONFIRMÉ]                       |
                                      |                                  |
                                      | [ PATIENT ARRIVÉ ]               |
                                      |                                  |
                                      | [Ouvrir patient]                 |
                                      | [Modifier]                       |
                                      |                                  |
                                      | ⋮ Reporter                       |
                                      |   Annuler                        |
                                      +--------------------------------+
```

Primary button changes according to status.

------------------------------------------------------------------------

# 15. Screen 12 --- Create/Edit appointment

``` text
Nouveau rendez-vous

Patient *
[ Rechercher nom / téléphone...       ▼]
+ Créer un nouveau patient

Praticien *
[ Dr. Benali                          ▼]

Service / Motif *
[ Consultation                        ▼]

Date *
[ 23/08/2026 ]

Type de rendez-vous
(●) Heure fixe
( ) Plage horaire

Heure
[10:30]

Durée
[30 min ▼]

Statut initial
[À confirmer ▼]

Note interne
[____________________________________]

[ANNULER]                   [CRÉER LE RENDEZ-VOUS]
```

Window mode replaces time with `De` / `À`.

------------------------------------------------------------------------

# 16. Screen 13 --- Public booking requests

``` text
Demandes de rendez-vous                         4 en attente

[Search]   [Date ▼] [Statut ▼]

Nom              Téléphone     Motif        Souhait       Statut
Ahmed...         06...         Consult.     24/08 10:00   Demandé
Sara...          06...         Contrôle     24/08 11:00   Demandé

Row click -> request detail drawer

Actions:
[Confirmer]
[Proposer autre créneau]
[Refuser]
```

------------------------------------------------------------------------

# 17. Screen 14 --- Waiting room

``` text
File d'attente                                      Aujourd'hui

Patient              RDV        Arrivé       Attente       Statut
Ahmed                10:00      09:58        12 min        En attente
Sara                 10:30      10:22         3 min        Arrivée
Youssef              11:00      -            -             Attendu
```

Direct state actions appear per row.

------------------------------------------------------------------------

# 18. Screen 15 --- Patients list

``` text
Patients                                      [+ Nouveau patient]

[ Rechercher nom, téléphone, numéro... ]

[Filtres]

Patient               Téléphone      Praticien      Dernière   Prochain   Solde
Ahmed El Mansouri     06...          Dr Benali      18/08      27/08      1 500
Sara Alaoui           06...          Dr Benali      20/08      -          -
```

Mobile rows become patient cards.

------------------------------------------------------------------------

# 19. Screen 16 --- Create patient

``` text
Nouveau patient

INFORMATIONS PRINCIPALES

Prénom *                Nom *
[___________]           [___________]

Téléphone *
[_______________________]

Praticien responsable *
[ Dr. Benali          ▼]

INFORMATIONS COMPLÉMENTAIRES
[Afficher]

Date de naissance
Email
Ville
Adresse
Contact d'urgence

[ANNULER]                          [CRÉER LE PATIENT]
```

Duplicate warning appears before final creation if match found.

------------------------------------------------------------------------

# 20. Screen 17 --- Patient 360° overview

``` text
Ahmed El Mansouri                                      PAT-00281
06... · 34 ans · Dr. Benali

Prochain RDV: 27 août · 10:30             Solde: 1 500 MAD

[+ RDV] [Facturer] [Encaisser] [Plus ▼]

Aperçu | Dossier Santé | Rendez-vous | Traitements | Factures | Paiements

+-------------------------+ +-------------------------+
| Prochain RDV            | | Traitement actif        |
| 27 août · 10:30         | | Rééducation genou        |
| Consultation             | | 12 / 20 séances          |
+-------------------------+ +-------------------------+

+-------------------------+ +-------------------------+
| Solde                   | | Prochaine échéance       |
| 1 500 MAD               | | 500 MAD · 01/09          |
+-------------------------+ +-------------------------+

ACTIVITÉ RÉCENTE
23 août  Consultation terminée
23 août  Paiement +500 MAD
20 août  Document ajouté
```

------------------------------------------------------------------------

# 21. Screen 18 --- Dossier Santé

``` text
Patient header + tabs

DOSSIER SANTÉ

INFORMATIONS IMPORTANTES

Allergies
[ Pénicilline ]                              [+ Ajouter]

Antécédents
[ Hypertension ]                             [+ Ajouter]

Traitements actuels
Aucun                                        [+ Ajouter]

------------------------------------------------------------

HISTORIQUE CLINIQUE                         [+ Nouvelle entrée]

23 AOÛT 2026
Consultation · Dr Benali

Motif
Douleur lombaire

Observations
...

Documents
IRM_lombaire.pdf

[Ouvrir l'entrée]
```

------------------------------------------------------------------------

# 22. Screen 19 --- Add master-data health value

Modal/drawer:

``` text
Ajouter un antécédent

[ Rechercher... ]

SUGGESTIONS
Hypertension artérielle
Diabète
Asthme
Maladie cardiovasculaire

----------------------
+ Ajouter une valeur personnalisée

[ANNULER]
```

------------------------------------------------------------------------

# 23. Screen 20 --- Active consultation

``` text
Ahmed El Mansouri                     Consultation · 23 août · 10:00

Motif
[ Douleur lombaire                                    ]

FORMULAIRE CLINIQUE
[ Specialty-driven fields ]

Observations
[                                                     ]
[                                                     ]

Informations importantes
Allergies: Pénicilline

Documents
[+ Ajouter]

Documents cliniques
[+ Prescription] [+ Certificat] [+ Rapport]

------------------------------------------------------------
[Enregistrer brouillon]                 [TERMINER CONSULTATION]
```

Desktop may use narrow right context column for patient flags. Mobile
stacks it.

------------------------------------------------------------------------

# 24. Screen 21 --- Patient documents

Documents remain within Dossier Santé, optionally as filtered
subsection.

``` text
Documents

[+ Ajouter un document]

Type          Document             Date        Praticien       Actions
Imagerie      IRM_lombaire.pdf     20/08       Dr Benali       Voir
Analyse       Resultats.pdf        10/08       Dr Benali       Voir
```

------------------------------------------------------------------------

# 25. Screen 22 --- Treatment plan detail

``` text
Rééducation genou                                [ACTIF]

Ahmed El Mansouri
Dr. Benali
Début: 10 août
20 séances

PROGRESSION
12 / 20 terminées
[====================]

SÉANCES
01 ✓ 02 ✓ 03 ✓ 04 ✓ 05 ✓
06 ✓ 07 ✓ 08 ✓ 09 ✓ 10 ✓
11 ✓ 12 ✓ 13 ○ 14 ○ 15 ○
16 ○ 17 ○ 18 ○ 19 ○ 20 ○

Prochaine séance
26 août · 15:00

[PLANIFIER PROCHAINE SÉANCE]

FINANCE
Facturé       4 000 MAD
Payé          2 500 MAD
Reste         1 500 MAD
```

Finance section is visually separated from clinical progress.

------------------------------------------------------------------------

# 26. Screen 23 --- Session detail

``` text
Séance 13 / 20

Statut: Planifiée
Date: 26 août · 15:00
Praticien: Dr Benali

[Ouvrir le RDV]

After completion:
Date réelle
Clinical entry link
Notes/progress
```

------------------------------------------------------------------------

# 27. Screen 24 --- Finance overview

``` text
Finance

Aperçu | Factures | Échéances | Encaissements | Caisse | Décaissements

Ce mois                    [Période ▼] [Praticien ▼]

+--------------+ +--------------+ +--------------+ +--------------+
| Facturé      | | Encaissé     | | À encaisser  | | En retard    |
| 38 500 MAD   | | 31 200 MAD   | | 7 300 MAD    | | 2 100 MAD    |
+--------------+ +--------------+ +--------------+ +--------------+

Décaissements
12 400 MAD

ÉCHÉANCES À TRAITER
...
```

------------------------------------------------------------------------

# 28. Screen 25 --- Invoice list

``` text
Factures                                      [+ Nouvelle facture]

[Search] [Période ▼] [Statut ▼] [Praticien ▼]

Facture        Patient        Date      Total      Payé      Reste     Statut
FAC-00182      Ahmed          23/08     3 000      1 000     2 000     Partiel
FAC-00181      Sara           23/08       400        400         0     Payée
```

------------------------------------------------------------------------

# 29. Screen 26 --- Invoice detail

``` text
FAC-2026-00182                           [PARTIELLEMENT PAYÉE]

Ahmed El Mansouri
23 août 2026
Dr Benali
Réf. RDV: RDV-...

LIGNES
Consultation                       1 x 500       500
Traitement                         1 x 2 500   2 500

Total                                         3 000 MAD
Payé                                          1 000 MAD
Reste                                         2 000 MAD

[ENCAISSER]

[Télécharger] [Imprimer] [Échéancier] [⋮]
```

------------------------------------------------------------------------

# 30. Screen 27 --- Record payment modal

``` text
Encaisser

Ahmed El Mansouri
FAC-2026-00182

Reste à payer
2 000 MAD

Montant reçu
[ 500 ] MAD

Mode de paiement
[ Espèces ▼ ]

[ANNULER]                    [ENCAISSER 500 MAD]
```

Button enters loading/disabled state after submission.

------------------------------------------------------------------------

# 31. Screen 28 --- Payment success / receipt

``` text
✓ Paiement enregistré

500 MAD

Ahmed El Mansouri
FAC-2026-00182

Reste à payer
1 500 MAD

[IMPRIMER LE REÇU]
[Télécharger]
[Envoyer confirmation]

[Terminer]
```

------------------------------------------------------------------------

# 32. Screen 29 --- Installments

``` text
Échéancier — FAC-2026-00182

Total: 12 000 MAD

#     Date         Montant       Payé       Reste       Statut
1     01/08        3 000         3 000       0          Payée
2     01/09        3 000         3 000       0          Payée
3     01/10        3 000             0   3 000          À venir
4     01/11        3 000             0   3 000          À venir
```

Overdue row becomes semantically prominent.

------------------------------------------------------------------------

# 33. Screen 30 --- Caisse

``` text
Caisse                                         23 août

[OUVERTE] depuis 08:02

+------------------+ +------------------+
| Solde initial    | | Encaissements    |
| 500 MAD          | | 4 200 MAD        |
+------------------+ +------------------+

+------------------+ +------------------+
| Décaissements    | | Solde attendu    |
| 850 MAD          | | 3 850 MAD        |
+------------------+ +------------------+

MOUVEMENTS
10:32  Ahmed · FAC-00182          +500 MAD
10:45  Fournitures                -150 MAD
11:04  Sara · FAC-00183           +400 MAD

[FERMER LA CAISSE]
```

------------------------------------------------------------------------

# 34. Screen 31 --- Close caisse modal

``` text
Fermer la caisse

Solde attendu
3 850 MAD

Espèces comptées
[ 3 820 ] MAD

Écart
-30 MAD

Motif de l'écart *
[________________________________]

[ANNULER]                  [CONFIRMER LA FERMETURE]
```

Reason only mandatory/displayed if discrepancy exists.

------------------------------------------------------------------------

# 35. Screen 32 --- Décaissements

``` text
Décaissements                             [+ Nouveau décaissement]

[Période ▼] [Catégorie ▼]

Date      Catégorie       Bénéficiaire       Montant      Mode
23/08     Fournitures     Fournisseur X      150 MAD      Espèces
22/08     Utilité         Eau                300 MAD      Espèces
```

New decaissement modal/form uses category, beneficiary, description,
amount, payment method and attachment.

------------------------------------------------------------------------

# 36. Screen 33 --- Team list

``` text
Équipe                                        [+ Ajouter un membre]

Membre             Profil              Statut
Dr Benali          Propriétaire        Actif
Sara Alaoui        Réception           Actif
Dr Amal            Praticien           Actif
```

Solo empty state replaces table when no additional staff exists.

------------------------------------------------------------------------

# 37. Screen 34 --- Employee profile

``` text
Sara Alaoui
Réception · Active

Profil | Planning | Congés | Paie | Documents | Permissions

PROFIL
Téléphone
Email
Date début
Informations contrat
...
```

Commissions tab appears for applicable practitioners.

------------------------------------------------------------------------

# 38. Screen 35 --- Permissions

``` text
Sara Alaoui — Permissions

PATIENTS
[x] Voir
[x] Créer
[x] Modifier informations administratives

RENDEZ-VOUS
[x] Gérer

FACTURES
[x] Voir
[x] Créer

ENCAISSEMENTS
[x] Enregistrer

CAISSE
[x] Accéder

DOSSIER SANTÉ
[ ] Accéder

PAIE
[ ] Accéder

[ENREGISTRER]
```

------------------------------------------------------------------------

# 39. Screen 36 --- Leave

Staff view:

``` text
Mes congés                              [Demander un congé]

Type        Dates           Statut
Annuel      04-05/09        En attente
```

Owner view adds pending requests with Approve/Reject.

------------------------------------------------------------------------

# 40. Screen 37 --- Payroll

``` text
Paie — Août 2026

Employé       Base      Bonus    Commission    Ajust.    Net       Statut
Sara          5 000       300          -          -      5 300     Non payé
Dr Amal       8 000         -        3 200         -     11 200     Non payé
```

Operational payroll only.

------------------------------------------------------------------------

# 41. Screen 38 --- Commissions

``` text
Commissions — Août 2026

Dr Amal

Base de calcul
Montants encaissés

Montant éligible          24 000 MAD
Taux                           30%
Commission calculée         7 200 MAD

DÉTAIL
...
```

Always display calculation basis.

------------------------------------------------------------------------

# 42. Screen 39 --- Inventory list

``` text
Stock                                      [+ Nouvel article]

[Search] [Alertes ▼]

Article          Stock       Minimum      Lot       Expiration      Statut
Gants            20 boîtes   10           -         -               Normal
Produit X         3 unités    5           L102      10/09           Stock faible

[Entrée stock] [Sortie stock] [Ajustement]
```

------------------------------------------------------------------------

# 43. Screen 40 --- Stock item

``` text
Produit X

Stock actuel       3
Minimum            5
[STOCK FAIBLE]

LOTS
L102      3 unités      Exp. 10/09

MOUVEMENTS
23/08     Sortie       -2
20/08     Entrée       +5

[ENTRÉE] [SORTIE] [AJUSTEMENT]
```

------------------------------------------------------------------------

# 44. Screen 41 --- Communication history

``` text
Communication

Messages | Modèles | Automatisations

[Search patient] [Canal ▼] [Statut ▼]

Patient       Type             Canal       Date       Statut
Ahmed         Rappel RDV       WhatsApp    23/08      Livré
Sara          Paiement         SMS         23/08      Envoyé
```

------------------------------------------------------------------------

# 45. Screen 42 --- Template editor

``` text
Modifier le modèle

Nom
[Rappel rendez-vous]

Canal
[WhatsApp ▼]

Langue
[Français ▼]

Message
[Bonjour {{patient_name}}, votre rendez-vous...]

VARIABLES
patient_name
appointment_date
appointment_time
practice_name

APERÇU
...

[ANNULER]                           [ENREGISTRER]
```

------------------------------------------------------------------------

# 46. Screen 43 --- Reports

``` text
Rapports

[Période ▼] [Praticien ▼] [Service ▼]

RDV          No-show       Encaissé       À encaisser
...

ACTIVITÉ
[Simple chart]

PERFORMANCE PAR PRATICIEN
[Table]

SERVICES
[Table/chart]
```

Avoid chart overload.

------------------------------------------------------------------------

# 47. Screen 44 --- Settings home

``` text
Paramètres

Cabinet
Praticiens
Services & tarifs
Horaires
Utilisateurs & permissions
Master Data
Documents & numérotation
Communication
Intégrations
Langue & préférences
```

Each item opens a focused settings page.

------------------------------------------------------------------------

# 48. Screen 45 --- Services & pricing

``` text
Services & tarifs                           [+ Ajouter]

[Search]

Service          Prix       Durée       Mode RDV        Actif
Consultation     400 MAD    30 min      Heure fixe     ✓
Contrôle         250 MAD    20 min      Heure fixe     ✓
Kiné séance      300 MAD    45 min      Plage          ✓
```

Edit opens drawer/page depending complexity.

------------------------------------------------------------------------

# 49. Screen 46 --- Users & permissions

``` text
Utilisateurs                                 [+ Ajouter]

Nom            Profil          Statut       Accès
Dr Benali      Owner/Admin     Actif        Complet
Sara           Staff           Actif        Personnalisé
Dr Amal        Practitioner    Actif        Praticien
```

------------------------------------------------------------------------

# 50. Screen 47 --- Subscription

``` text
Mon abonnement

Plan
CABINET

Statut
ACTIF

Période
Mensuel

Prochain renouvellement
23 septembre 2026

[RENOUVELER / GÉRER]

Utilisation
Praticiens   2 / 3
Personnel    1 / 5
Stockage     ...
```

Keep commercial information understandable.

------------------------------------------------------------------------

# 51. Screen 48 --- Subscription warning

Banner:

``` text
Votre abonnement expire dans 7 jours.
[Renouveler]
```

Grace:

``` text
Votre abonnement a expiré. Il reste 2 jours avant suspension.
[Renouveler maintenant]
```

------------------------------------------------------------------------

# 52. Screen 49 --- Blackout

``` text
                [Logo]

        Votre abonnement a expiré

Votre accès opérationnel est suspendu.
Vos données restent conservées.

[ RENOUVELER MON ABONNEMENT ]

[Contacter le support]

[Se déconnecter]
```

No operational sidebar.

------------------------------------------------------------------------

# 53. Screen 50 --- Referral

``` text
Parrainage

Invitez un confrère.
Lorsqu'il devient abonné, vous gagnez 1 mois gratuit.

Votre code
AMAL8K2

Votre lien
app.ma/r/AMAL8K2

[COPIER LE LIEN]

PARRAINAGES
Dr X       Essai
Dr Y       Validé       +1 mois
```

------------------------------------------------------------------------

# 54. Screen 51 --- Public booking page

Mobile-first:

``` text
              [Logo]

          Cabinet Dr Benali
              Dentiste

         Prendre rendez-vous

Prénom
[_____________________]

Nom
[_____________________]

Téléphone
[_____________________]

Motif
[ Consultation      ▼]

Date souhaitée
[ 27 août 2026       ]

Créneau
[ 10:00-10:30       ▼]

Commentaire (facultatif)
[_____________________]

[ DEMANDER LE RENDEZ-VOUS ]
```

No account/password.

------------------------------------------------------------------------

# 55. Screen 52 --- Public booking confirmation

``` text
✓ Votre demande a été envoyée

Le cabinet doit encore confirmer votre rendez-vous.

Vous recevrez une confirmation par WhatsApp ou SMS.

Cabinet Dr Benali
06...
```

Do not say confirmed until confirmed.

------------------------------------------------------------------------

# 56. Screen 53 --- Public booking / QR settings

``` text
Réservation en ligne

Votre lien
app.ma/book/cabinet-benali

[COPIER]

QR CODE
[        QR        ]

[TÉLÉCHARGER]
[IMPRIMER]

Statut
[x] Réservation en ligne active
```

------------------------------------------------------------------------

# 57. Screen 54 --- SaaS Admin dashboard

Separate shell:

``` text
Platform Admin

Dashboard
Cabinets
Abonnements
Plans
Master Data
Parrainages
Operations
Audit

------------------------------------------------

Cabinets actifs       Trials       Expirent bientôt      Blackout
1 240                  84           32                    11

New subscriptions
...

System alerts
...
```

No clinical data on dashboard.

------------------------------------------------------------------------

# 58. Screen 55 --- SaaS tenant list

``` text
Cabinets

[Search] [Plan ▼] [Statut ▼] [Spécialité ▼]

Cabinet        Owner       Specialty     Plan      Status     Renewal
...
```

Tenant detail exposes subscription/operational metadata; sensitive
clinical access is not a default support function.

------------------------------------------------------------------------

# 59. Screen 56 --- SaaS subscription management

Tenant detail:

``` text
Cabinet Atlas

Plan          Cabinet
Status        Active
Period        Monthly
Renewal       23/09

Trial history
Payments
Referral credit
Entitlements

[Administrative action ▼]
```

Manual adjustments require reason and audit.

------------------------------------------------------------------------

# 60. Screen 57 --- SaaS master data

``` text
Master Data

Category [Services ▼]
Language [FR/AR]

[Search]                            [+ Ajouter]

Code       Français            العربية        Specialty       Active
...
```

------------------------------------------------------------------------

# 61. Screen 58 --- SaaS referral review

``` text
Parrainages

Referrer       Referred       First payment       Status
Cabinet A      Cabinet B      500 MAD             Pending validation

Detail:
Attribution
Trial
First paid
Validation period
Fraud signals
Reward

[APPROUVER] [REJETER]
```

Manual decision requires reason.

------------------------------------------------------------------------

# 62. Responsive rules by screen family

## Operational lists

Desktop: table.\
Mobile: reduced-column cards/list.

## Agenda

Desktop: time grid.\
Mobile: chronological day list.

## Patient 360°

Desktop: full header + horizontal tabs.\
Mobile: compact header + horizontally scrollable tabs.

## Clinical

Desktop: main form + optional context rail.\
Mobile: one-column stacked form.

## Finance

Desktop: metric cards + tables.\
Mobile: 2-column metrics + stacked list.

## Modal

Desktop: centered modal.\
Mobile: bottom/full-screen sheet when space requires.

## Drawer

Desktop: right drawer.\
Mobile: full-screen sheet.

------------------------------------------------------------------------

# 63. Keyboard behavior

Desktop power users should be able to:

-   Tab through forms.
-   Navigate combobox suggestions.
-   Escape drawers/modals safely.
-   Submit forms through expected keyboard behavior.
-   Use visible focus indicators.

Future shortcuts may be added after user testing; do not invent a
complex shortcut system in V1.

------------------------------------------------------------------------

# 64. Loading wireframes

Patient page:

``` text
[================]  [======]
[========] [========]

[==========================]
[==========================]
```

Use skeletons matching final layout.

Payment submit:

``` text
[ ENREGISTREMENT... ]
```

Button disabled to prevent duplicate submission.

------------------------------------------------------------------------

# 65. Empty-state wireframes

Patients:

``` text
Aucun patient pour le moment.

Ajoutez votre premier patient pour commencer.

[AJOUTER UN PATIENT]
```

Agenda:

``` text
Aucun rendez-vous aujourd'hui.

[CRÉER UN RENDEZ-VOUS]
[Partager le lien de réservation]
```

Team:

``` text
Vous travaillez actuellement seul.

[AJOUTER UN MEMBRE]
```

------------------------------------------------------------------------

# 66. Error-state wireframes

Appointment conflict:

``` text
Ce créneau n'est plus disponible.

Créneaux proches:
[10:30] [11:00] [11:30]
```

Permission:

``` text
Vous n'avez pas accès à cette information.
```

Provider:

``` text
Le rendez-vous est confirmé, mais le message WhatsApp n'a pas pu être envoyé.

[Réessayer]
```

Financial errors must never imply success when transaction failed.

------------------------------------------------------------------------

# 67. Sensitive confirmation examples

Reverse payment:

``` text
Annuler ce paiement ?

Paiement: 500 MAD
Patient: Ahmed El Mansouri
Facture: FAC-00182

Cette action créera une écriture d'annulation.
Le paiement original restera dans l'historique.

Motif *
[____________________________]

[RETOUR] [CONFIRMER L'ANNULATION]
```

Change responsible practitioner:

``` text
Changer le praticien responsable ?

Dr Benali -> Dr Amal

L'historique clinique conservera ses auteurs d'origine.

[ANNULER] [CONFIRMER]
```

------------------------------------------------------------------------

# 68. Page composition rules

Every major page should generally have:

``` text
AppShell
  PageHeader
  Primary content
  Contextual actions
  Loading/empty/error handling
```

Avoid nested cards within cards within cards.

------------------------------------------------------------------------

# 69. Screen-to-component mapping

Examples:

## Aujourd'hui

``` text
AppShell
PageHeader
MetricCard
AppointmentCard/List
Alert/ActionList
CaisseSummary
```

## Agenda

``` text
AppShell
PageHeader
FilterBar
Calendar
AppointmentCard
AppointmentDrawer
```

## Patient

``` text
PatientHeader
Tabs
MetricCard
ClinicalTimeline
InvoiceSummary
SessionProgress
```

## Finance

``` text
Tabs
MetricCard
FilterBar
Table
StatusBadge
PaymentModal
```

------------------------------------------------------------------------

# 70. Wireframe implementation rule for Claude

Claude Code must not interpret ASCII wireframes as pixel-perfect
measurements.

It must preserve:

-   Information hierarchy.
-   Component relationships.
-   Primary/secondary action hierarchy.
-   Contextual interaction choice.
-   Responsive behavior.
-   Required data/state.

Exact spacing/colors/typography come from Specification #8.

------------------------------------------------------------------------

# 71. Required screen states

Every screen implementation must consider applicable:

``` text
Loading
Loaded
Empty
Filtered-empty
Validation error
Permission denied
Subscription blocked
Network/system error
Success feedback
```

Do not implement only the ideal loaded state.

------------------------------------------------------------------------

# 72. Role-aware wireframes

The same screen can suppress actions according to permission.

Example Patient 360°:

Owner: `+ RDV / Facturer / Encaisser / Plus`

Practitioner without finance: `+ RDV / Clinical action / Plus`

Reception: `+ RDV / Facturer / Encaisser` if authorized, but no clinical
action.

Do not create separate pages per role.

------------------------------------------------------------------------

# 73. Specialty-aware wireframes

Kiné patient overview may prioritize SessionProgress.

Psychology may prioritize next session and clinical history.

Dentistry may later add specialty components.

Common page architecture remains stable.

------------------------------------------------------------------------

# 74. V1 wireframe priority tiers

## Tier 1 --- Must be polished before pilot

-   Login.
-   Onboarding.
-   Aujourd'hui.
-   Agenda.
-   Appointment drawer/create.
-   Patients.
-   Patient 360°.
-   Dossier Santé.
-   Consultation.
-   Treatment/session.
-   Invoice.
-   Payment.
-   Receipt.
-   Caisse.
-   Public booking.

## Tier 2

-   Installments.
-   Team.
-   Permissions.
-   Inventory.
-   Communication.
-   Subscription.
-   Referral.

## Tier 3

-   Reports.
-   Payroll.
-   Advanced settings.
-   SaaS Admin.

Tier affects design/polish priority, not necessarily functional
requirement.

------------------------------------------------------------------------

# 75. Final frontend planning baseline

Specifications #7--#9 now define:

``` text
#7 — How the product should feel and behave
#8 — What visual/component system it uses
#9 — How major screens are composed
```

Claude Code frontend implementation must read these together with the
relevant functional, workflow, domain and security specifications.

The next project action is to update `CLAUDE.md` and Specification #6 so
frontend tasks explicitly require Specifications #7--#9 before
implementation, then resume the implementation sequence.
