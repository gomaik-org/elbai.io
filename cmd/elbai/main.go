package main

import (
	"fmt"
	"os"

	"github.com/maikcli/elbai.io/pkg/version"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "elbai",
	Short: "elbAI.io Unified Developer CLI & Edge Automation Tool",
	Long:  `elbAI.io CLI: Unified engineering tooling for Astro Edge Deployments, Cloudflare Cache Purging, and Living Documentation.`,
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version and engine details",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("elbAI CLI v%s (%s) [Go %s]\n", version.Version, version.Codename, version.GoVersion)
	},
}

func main() {
	rootCmd.AddCommand(versionCmd)
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
