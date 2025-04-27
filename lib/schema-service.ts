import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"

export interface TableInfo {
  table_name: string
  columns: ColumnInfo[]
  foreign_keys: ForeignKeyInfo[]
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: boolean
  is_primary_key: boolean
}

export interface ForeignKeyInfo {
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
}

export interface SchemaInfo {
  tables: TableInfo[]
}

export async function getSchemaInfo(): Promise<SchemaInfo> {
  try {
    const supabase = createClient()

    // Get tables
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables")

    if (tablesError) {
      logger.error("Error fetching tables", tablesError)
      throw tablesError
    }

    // Get columns for each table
    const tablesWithColumns = await Promise.all(
      tables.map(async (tableName: string) => {
        const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", {
          table_name: tableName,
        })

        if (columnsError) {
          logger.error(`Error fetching columns for table ${tableName}`, columnsError)
          throw columnsError
        }

        // Get foreign keys for the table
        const { data: foreignKeys, error: fkError } = await supabase.rpc("get_foreign_keys", { table_name: tableName })

        if (fkError) {
          logger.error(`Error fetching foreign keys for table ${tableName}`, fkError)
          throw fkError
        }

        return {
          table_name: tableName,
          columns,
          foreign_keys: foreignKeys,
        }
      }),
    )

    return { tables: tablesWithColumns }
  } catch (error) {
    logger.error("Error getting schema info", error)
    return { tables: [] }
  }
}

export function generateMermaidDiagram(schema: SchemaInfo): string {
  try {
    let diagram = "erDiagram\n"

    // Add tables and columns
    schema.tables.forEach((table) => {
      diagram += `  ${table.table_name} {\n`

      table.columns.forEach((column) => {
        const pk = column.is_primary_key ? "PK " : ""
        const nullable = column.is_nullable ? "" : "NOT NULL "
        diagram += `    ${column.data_type} ${column.column_name} ${pk}${nullable}\n`
      })

      diagram += "  }\n"
    })

    // Add relationships
    schema.tables.forEach((table) => {
      table.foreign_keys.forEach((fk) => {
        diagram += `  ${table.table_name} }o--|| ${fk.foreign_table_name} : "${fk.column_name}"\n`
      })
    })

    return diagram
  } catch (error) {
    logger.error("Error generating Mermaid diagram", error)
    return 'erDiagram\n  Error { string message "Failed to generate diagram" }'
  }
}

export async function getTableCount(): Promise<number> {
  try {
    const schema = await getSchemaInfo()
    return schema.tables.length
  } catch (error) {
    logger.error("Error getting table count", error)
    return 0
  }
}

export async function getColumnCount(): Promise<number> {
  try {
    const schema = await getSchemaInfo()
    return schema.tables.reduce((sum, table) => sum + table.columns.length, 0)
  } catch (error) {
    logger.error("Error getting column count", error)
    return 0
  }
}

export async function getRelationshipCount(): Promise<number> {
  try {
    const schema = await getSchemaInfo()
    return schema.tables.reduce((sum, table) => sum + table.foreign_keys.length, 0)
  } catch (error) {
    logger.error("Error getting relationship count", error)
    return 0
  }
}
