from django.db import migrations
import csv
import os

def load_data(apps, schema_editor):
    Node = apps.get_model("app", "Node")
    Topic = apps.get_model("app", "Topic")
    Concept = apps.get_model("app", "Concept")
    Relationship = apps.get_model("app", "Relationship")
    Module = apps.get_model("app", "Module")

    base_dir = os.path.dirname(__file__)

     # === Load Modules ===
    modules_path = os.path.join(base_dir, "modules.csv")
    module_map = {}  # cache for module lookup

    if os.path.exists(modules_path):
        with open(modules_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                module_id = int(row["module_id"])
                module, _ = Module.objects.update_or_create(
                    id=module_id,  # use module_id as PK
                    defaults={
                        "index": row.get("module_index", ""),
                        "name": row.get("module_name", ""),
                    }
                )
                module_map[row['module_id']] = module
                
    # === Load Nodes (generic) ===
    nodes_path = os.path.join(base_dir, "nodes.csv")
    with open(nodes_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            node_id = int(row["node_id"])
            name = row["node_name"]
            summary = row["node_description"]
            node_type = row["node_type"].lower()
            module_id = row.get("node_module_id")
            module = module_map.get(module_id) if module_id else None

            if node_type == "topic":
                Topic.objects.update_or_create(
                    id=node_id,
                    defaults={"name": name, "summary": summary, "module": module}
                )
            elif node_type == "concept":
                parent_id = int(row["parent_node_id"]) if row["parent_node_id"] else None
                if parent_id:
                    parent_topic = Topic.objects.get(id=parent_id)
                    Concept.objects.update_or_create(
                        id=node_id,
                        defaults={
                            "name": name,
                            "summary": summary,
                            "related_topic": parent_topic,
                            "module": module or parent_topic.module
                        }
                    )
                else:
                    Node.objects.update_or_create(
                        id=node_id,
                        defaults={"name": name, "summary": summary, "module": module}
                    )
            else:
                Node.objects.update_or_create(
                    id=node_id,
                    defaults={"name": name, "summary": summary, "module": module}
                )
                

    # === Load Relationships ===
    rels_path = os.path.join(base_dir, "relationships.csv")
    with open(rels_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rel_id = int(row["relationship_id"])
            first_node = Node.objects.get(id=int(row["node_id_1"]))
            second_node = Node.objects.get(id=int(row["node_id_2"]))
            rs_type = row["relationship_type"]

            Relationship.objects.update_or_create(
                id=rel_id,
                defaults={"first_node": first_node, "second_node": second_node, "rs_type": rs_type}
            )

def unload_data(apps, schema_editor):
    Node = apps.get_model("app", "Node")
    Relationship = apps.get_model("app", "Relationship")
    Module = apps.get_model("app", "Module")
    Relationship.objects.all().delete()
    Node.objects.all().delete()
    Module.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ("app", "0002_load_nodes_and_relationships"),  # adjust if needed
    ]

    operations = [
        migrations.RunPython(load_data, reverse_code=unload_data),
    ]
