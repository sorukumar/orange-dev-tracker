import pandas as pd
import networkx as nx

class Consolidator:
    @staticmethod
    def normalize(commits_df):
        """
        Consolidates contributors based on shared Name or Email.
        Returns the dataframe with 'canonical_id' and 'canonical_name' columns.
        """
        print("Consolidating contributor identities...")
        
        # 1. Build a Graph where nodes are (Type, Value)
        # Type is 'name' or 'email'.
        # Edges represent that a single commit linked them.
        G = nx.Graph()
        
        
        for _, row in commits_df.iterrows():
            name = row['author_name']
            email = row['author_email']
            
            name_node = f"NAME:{name}"
            email_node = f"EMAIL:{email}"
            
            # IGNORE SHARED EMAILS/NAMES
            # These are used by multiple people (e.g. bots) and cause incorrect merging of identities
            IGNORE_EMAILS = {
                "90386131+bitcoin-core-merge-script@users.noreply.github.com",
                "bitcoin-core-merge-script@users.noreply.github.com"
            }
            
            IGNORE_NAMES = {
                "merge-script",
                "Bitcoin Core Merge Script"
            }
            
            if email in IGNORE_EMAILS or name in IGNORE_NAMES:
                # Do not link this email to the name
                # Just continue. We don't even need to add the nodes if they are garbage.
                # Actually, we should probably add the valid part if one is valid, but if the link is bad, skip the link.
                # If name is 'merge-script', we don't want to link it to ANY email.
                # If email is 'shared-bot', we don't want to link it to ANY name.
                # So we just skip the edge info.
                
                # However, we must ensure we don't lose the valid identity.
                # If I am 'Hennadii' and I use 'shared-bot' email, I still want 'Hennadii' node to exist.
                # If I use 'merge-script' name and 'my-email', I want 'my-email' node to exist.
                
                if name not in IGNORE_NAMES:
                     G.add_node(name_node, type='name', value=name)
                
                if email not in IGNORE_EMAILS:
                     G.add_node(email_node, type='email', value=email)
                     
                continue

            # Add nodes
            G.add_node(name_node, type='name', value=name)
            G.add_node(email_node, type='email', value=email)
            
            # Link them
            G.add_edge(name_node, email_node)

        # 3. Manual Overrides (Synthetic Edges)
        # These link loose manifests (Names) that the automated graph missed.
        # Derived from GithubBitcoin.ipynb manual cleaning logic.
        MANUAL_ALIASES = [
            ("Matt Corallo", "TheBlueMatt"),
            ("Jeff Garzik", "jgarzik"),
            ("Gavin Andresen", "gavinandresen"),
            ("Antoine Riard", "ariard"),
            ("Jim Posen", "jimpo"),
            ("Micha", "Michagogo"),
            ("João Barbosa", "promag"),
            ("MarcoFalke", "MacroFake"), # Notebook typo? "MacroFake" -> MarcoFalke
            ("Nils Schneider", "tcatm"),
            ("Jorge Timón", "jtimon"),
            ("Pieter Wuille", "sipa"),
            ("Wladimir J. van der Laan", "laanwj"),
            ("Jonas Schnelli", "jonasschnelli"),
            ("MarcoFalke", "Marco Falke") # Just in case
        ]

        print(f"Injecting {len(MANUAL_ALIASES)} manual aliases...")
        for name1, name2 in MANUAL_ALIASES:
            n1 = f"NAME:{name1}"
            n2 = f"NAME:{name2}"
            if G.has_node(n1) and G.has_node(n2):
                G.add_edge(n1, n2)
            # else:
            #    print(f"  Skipping alias {name1}<->{name2} (nodes not found)")
            
        # 2. Find Connected Components (distinct identities)
        # Each component is a unique person
        mapping = {} # node -> canonical_id
        canonical_names = {} # canonical_id -> display_name (most common name or first found)
        
        for idx, component in enumerate(nx.connected_components(G)):
            group_id = idx
            names_in_group = []
            
            for node in component:
                mapping[node] = group_id
                if node.startswith("NAME:"):
                    names_in_group.append(node.split(":", 1)[1])
            
            # Pick a canonical name for the group
            # Heuristic: Shortest? Longest? Most frequent?
            # Let's pick the one that appears most often in the DF? 
            # Doing a frequency check on the whole DF is expensive.
            # Let's just pick the longest name as it's likely the most complete.
            if names_in_group:
                canonical_names[group_id] = max(names_in_group, key=len)
            else:
                canonical_names[group_id] = "Unknown"

        # 3. Map back to DataFrame
        def get_canonical(row):
            # Try email first
            node = f"EMAIL:{row['author_email']}"
            if node in mapping:
                gid = mapping[node]
                return gid, canonical_names[gid]
            
            # Try name
            node = f"NAME:{row['author_name']}"
            if node in mapping:
                gid = mapping[node]
                return gid, canonical_names[gid]
                
            return -1, "Unknown"

        # Apply is slow, but robust
        # Vectorized map is better
        # Create a map for emails and names directly
        email_to_id = {k.split(":", 1)[1]: v for k, v in mapping.items() if k.startswith("EMAIL:")}
        name_to_id = {k.split(":", 1)[1]: v for k, v in mapping.items() if k.startswith("NAME:")}
        
        # We need a unified ID. Email takes precedence?
        # Actually, since they are in the same component, they map to the same ID.
        # So we can just map author_email to ID.
        # But what if email is missing/empty? (Parquet schema says it's there).
        
        commits_df['canonical_id'] = commits_df['author_email'].map(email_to_id)
        
        # Fill missing with name map
        mask = commits_df['canonical_id'].isna()
        commits_df.loc[mask, 'canonical_id'] = commits_df.loc[mask, 'author_name'].map(name_to_id)
        
        # Map ID to Name
        commits_df['canonical_name'] = commits_df['canonical_id'].map(canonical_names)
        
        print(f"Consolidated into {commits_df['canonical_id'].nunique()} unique identities.")
        return commits_df
