# Wiz GraphQL Query Patterns & Schema Reference

This reference details canonical GraphQL query structures and variable parameters for the Wiz API.

---

## 1. Canonical Issues Query with Relay Pagination

```graphql
query GetIssues($first: Int, $after: String, $filterBy: IssueFilters) {
  issues(first: $first, after: $after, filterBy: $filterBy) {
    nodes {
      id
      title
      status
      severity
      createdAt
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

---

## 2. Schema Discovery Commands

```bash
# Search schema types and fields via local FTS5 index
./bin/wiz-blitz schema search "Issue"

# Inspect a specific GraphQL type
./bin/wiz-blitz schema show "Issue"
```
