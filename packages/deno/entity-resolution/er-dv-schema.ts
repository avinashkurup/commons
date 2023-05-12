import * as SQLa from "https://raw.githubusercontent.com/netspective-labs/sql-aide/main/render/mod.ts";
import * as dvp from "https://raw.githubusercontent.com/netspective-labs/sql-aide/main/pattern/data-vault.ts";

const ctx = SQLa.typicalSqlEmitContext();
type EmitContext = typeof ctx;

const stso = SQLa.typicalSqlTextSupplierOptions<EmitContext>();
const dvg = dvp.dataVaultGovn<EmitContext>(stso);
const { text, textNullable, integer, integerNullable, date } = dvg.domains;
const { ulidPrimaryKey: primaryKey } = dvg.keys;

const erEntityHub = dvg.hubTable("er_entity", {
  hub_er_entity_id: primaryKey(),
  ssn_business_key: text(),
  ...dvg.housekeeping.columns,
});

const erAlgorithmLookupTable = SQLa.tableDefinition("er_algorithm", {
  algorithm_id: primaryKey(),
  algorithm_name: text(),
  algorithm_version: text(),
  algorithm_sp: text(),
});

const erJobHub = dvg.hubTable("er_job", {
  hub_er_job_id: primaryKey(),
  job_business_job_name: text(),
  ...dvg.housekeeping.columns,
});

const erEntityHubSat = erEntityHub.satelliteTable("er_entity_attribute", {
  hub_er_entity_id: erEntityHub.references.hub_er_entity_id(),
  name: text(),
  address: text(),
  phone: text(),
  ...dvg.housekeeping.columns,
  sat_er_entity_er_entity_attribute_id: primaryKey(),
});

const erJobHubSat = erJobHub.satelliteTable("er_job_state", {
  algorithm_id: integer(),
  run_date_time: date(),
  status: text(),
  ...dvg.housekeeping.columns,
  hub_er_job_id: erJobHub.references.hub_er_job_id(),
  sat_er_job_er_job_state_id: primaryKey(),
});

const erEntityMatchLink = dvg.linkTable("er_entity_match", {
  link_er_entity_match_id: primaryKey(),
  hub_entity_id: erEntityHubSat.references
    .sat_er_entity_er_entity_attribute_id(),
  algorithm_ref: erAlgorithmLookupTable.references.algorithm_id(),
  ...dvg.housekeeping.columns,
});

const erEntityMatchLevenshteinLinkSat = erEntityMatchLink.satelliteTable(
  "er_entity_match_levenshtien",
  {
    distance_value: integer(),
    similarity_score: integer(),
    normalized_distance: integer(),
    notes: text(),
    ...dvg.housekeeping.columns,
    sat_er_entity_match_er_entity_match_levenshtien_id: primaryKey(),
    link_er_entity_match_id: erEntityMatchLink.references
      .link_er_entity_match_id(),
  },
);

const erEntityMatchSoundexLinkSat = erEntityMatchLink.satelliteTable(
  "er_entity_match_soundex",
  {
    code: text(),
    similarity_score: integer(),
    index: integer(),
    ...dvg.housekeeping.columns,
    sat_er_entity_match_er_entity_match_soundex_id: primaryKey(),
    link_er_entity_match_id: erEntityMatchLink.references
      .link_er_entity_match_id(),
  },
);

/**
 * Template which generates schema objects when none exist; other templates
 * should be defined for schema migrations.
 */
const seedDDL = SQLa.SQL<EmitContext>(stso)`
${erAlgorithmLookupTable}

${erEntityHub}

${erJobHub}

${erJobHubSat}

${erEntityMatchLink}

${erEntityMatchLevenshteinLinkSat}

${erEntityMatchSoundexLinkSat}`;

console.log(seedDDL.SQL(ctx));